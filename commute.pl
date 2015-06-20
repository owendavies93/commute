use Mojolicious::Lite;
use Time::Piece;
use Readonly;

Readonly my $CONFIG => '/etc/commute/commute.yaml';

my $config = plugin 'yaml_config', {
    file  => $CONFIG,
    class => 'YAML::XS',
};
plugin 'basic_auth';
plugin 'database', {
    dsn      => 'dbi:mysql:commute:',
    username => $config->{database}->{username},
    password => $config->{database}->{password},
};

under sub {
    my $c = shift;

    my $u = $config->{auth}->{username};
    my $p = $config->{auth}->{password};
    my $access = $c->basic_auth(
        realm => sub { return 1 if "@_" eq "$u $p" }
    );
    return 1 if $access;
    $c->render(text => 'Nope');
    return undef;
};

get '/' => sub { shift->render(template => 'index') };

get '/commutes' => sub { shift->redirect_to('/commute/commutes/all') };

get '/commutes/all' => sub {
    my $c = shift;
    my $res = $c->db->selectall_arrayref(
        'SELECT * FROM commutes', { Slice => {} });
    $c->render(json => $res);
};

post '/commutes/start' => sub {
    my $c = shift;

    my $hour   = localtime->[2];
    my $dir    = int($hour) <= 12 ? 'in' : 'out';
    my $status = $c->db->do(q(
        INSERT INTO commutes (start_time, direction)
        VALUES (CURRENT_TIMESTAMP, ?)
    ), undef, $dir);
    return $c->render(json => { message => ($status ? 'Started' : 'Failed') });
};

post '/commutes/intermediate' => sub {
    my $c = shift;

    my $status = $c->db->do(q(
        UPDATE commutes SET
        intermediate_timestamp = NOW(),
        intermediate_time = TIMESTAMPDIFF(SECOND, start_time, NOW())
        WHERE end_time IS NULL
        ORDER BY id DESC LIMIT 1
    ), undef);
    return $c->render(json => { message => ($status ? 'Added' : 'Failed') });
};

post '/commutes/end' => sub {
    my $c = shift;
    my $mpg = $c->param('mpg');
    my $len = $c->param('length');

    my $status = $c->db->do(q(
        UPDATE commutes SET end_time = NOW(), mpg = ?, length = ?,
        total_time = TIMESTAMPDIFF(SECOND, start_time, NOW())
        ORDER BY id DESC LIMIT 1
    ), undef, $mpg, $len);
    my ($commute_id) = $c->db->selectrow_array('SELECT MAX(id) FROM commutes');
    return $c->render(json => {
        message => ($status ? 'Ended' : 'Failed'),
        commute => $commute_id,
    });
};

get '/fuel_stops' => sub { shift->redirect_to('/commute/fuel_stops/all') };

get '/fuel_stops/all' => sub {
    my $c = shift;
    my $res = $c->db->selectall_arrayref(
        'SELECT * FROM fuel_stops', { Slice => {} });
    $c->render(json => $res);
};

post '/fuel_stops/new' => sub {
    my $c = shift;
    my $c_id = $c->param('commute_id');
    my $cost = $c->param('cost');

    my $status = $c->db->do(q(
        INSERT INTO fuel_stops (cost, date, commute_id)
        VALUES (?, NOW(), ?)
    ), undef, $cost, $c_id);
    my $msg = $status ? 'Added Fuel Stop' : 'Failed to add Fuel Stop';
    return $c->render(json => { message => $msg });
};

app->secrets(['commutes rock']);
app->start;

