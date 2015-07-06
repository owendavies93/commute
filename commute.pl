use Mojolicious::Lite;
use DBI;
use Time::Piece;
use Readonly;

Readonly my $CONFIG => '/etc/commute/commute.yaml';

my $config = plugin 'yaml_config', {
    file  => $CONFIG,
    class => 'YAML::XS',
};
plugin 'basic_auth';

app->attr(dbh => sub {
    my $c = shift;
    return DBI->connect(
        'dbi:mysql:commute:', 
        $config->{database}->{username}, 
        $config->{database}->{password},
        {RaiseError => 1, AutoCommit => 1, mysql_auto_reconnect => 1}
    );
});

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

get '/' => sub { 
    my $c = shift;

    my $routes = $c->app->dbh->selectcol_arrayref(q(
        SELECT DISTINCT name FROM routes
    ), undef);

    my $hour = localtime->[2];
    $c->stash(
        default_dir => (int($hour) <= 12 ? 'in' : 'out'),
        routes      => $routes,
    );
    $c->render(template => 'index') 
};

get '/commutes' => sub { shift->redirect_to('/commute/commutes/all') };

get '/commutes/all' => sub {
    my $c = shift;
    my $res = $c->app->dbh->selectall_arrayref(q(
        SELECT * FROM commutes JOIN routes ON commutes.route_id = routes.id
    ), { Slice => {} });
    $c->render(json => $res);
};

post '/commutes/start' => sub {
    my $c = shift;

    my $hour = localtime->[2];
    my $dir  = $c->param('direction');
    $dir //= (int($hour) <= 12 ? 'in' : 'out');
    
    my $status = $c->app->dbh->do(q(
        INSERT INTO commutes (start_time, direction)
        VALUES (CURRENT_TIMESTAMP, ?)
    ), undef, $dir);
    return $c->render(json => { message => ($status ? 'Started' : 'Failed') });
};

post '/commutes/intermediate' => sub {
    my $c = shift;
    my $time = $c->param('time');

    if (defined $time) {
        $time = $time / 1000;
        $time = localtime($time)->strftime('%F %T');
    }
    $time //= 'NOW()';

    my $status = $c->app->dbh->do(q(
        UPDATE commutes SET
        intermediate_timestamp = ?,
        intermediate_time = TIMESTAMPDIFF(SECOND, start_time, ?)
        WHERE end_time IS NULL
        ORDER BY id DESC LIMIT 1
    ), undef, $time, $time);
    return $c->render(json => { message => ($status ? 'Added' : 'Failed') });
};

post '/commutes/end' => sub {
    my $c = shift;
    my $mpg = $c->param('mpg');
    my $len = $c->param('length');
    my $r   = $c->param('route');

    my ($direction) = $c->app->dbh->selectrow_array(q(
        SELECT direction FROM commutes ORDER BY id DESC LIMIT 1
    ), undef);
    my ($route_id) = $c->app->dbh->selectrow_array(q(
        SELECT id FROM routes WHERE name = ? AND direction = ?
    ), undef, $r, $direction);

    my $status = $c->app->dbh->do(q(
        UPDATE commutes SET end_time = NOW(), mpg = ?, route_id = ?,
        total_time = TIMESTAMPDIFF(SECOND, start_time, NOW())
        ORDER BY id DESC LIMIT 1
    ), undef, $mpg, $route_id);
    my ($commute_id) = $c->app->dbh->selectrow_array('SELECT MAX(id) FROM commutes');
    return $c->render(json => {
        message => ($status ? 'Ended' : 'Failed'),
        commute => $commute_id,
    });
};

get '/fuel_stops' => sub { shift->redirect_to('/commute/fuel_stops/all') };

get '/fuel_stops/all' => sub {
    my $c = shift;
    my $res = $c->app->dbh->selectall_arrayref(
        'SELECT * FROM fuel_stops', { Slice => {} });
    $c->render(json => $res);
};

post '/fuel_stops/new' => sub {
    my $c = shift;
    my $c_id = $c->param('commute_id');
    my $cost = $c->param('cost');

    my $status = $c->app->dbh->do(q(
        INSERT INTO fuel_stops (cost, date, commute_id)
        VALUES (?, NOW(), ?)
    ), undef, $cost, $c_id);
    my $msg = $status ? 'Added Fuel Stop' : 'Failed to add Fuel Stop';
    return $c->render(json => { message => $msg });
};

post '/routes/new' => sub {
    my $c = shift;
    my $name  = $c->param('name');
    my $t_len = $c->param('length');
    my $i_len = $c->param('intermediate_length');

    return $c->render(json => { message => 'Intermediate needs to be less than total' })
        if !defined $i_len || !defined $t_len || $t_len <= $i_len;

    # Insert supplied values in the 'in' direction, then reverse for 'out'
    my $status1 = $c->app->dbh->do(q(
        INSERT INTO routes (name, direction, length, intermediate_length)
        VALUES (?, 'in', ?, ?)
    ), undef, $name, $t_len, $i_len);
    my $status2 = $c->app->dbh->do(q(
        INSERT INTO routes (name, direction, length, intermediate_length)
        VALUES (?, 'out', ?, ?)
    ), undef, $name, $t_len, $t_len - $i_len);

    my $msg = ($status1 && $status2) ? 'Added' : 'Failed';
    return $c->render(json => { message => $msg });
};

app->config(hypnotoad => { listen => ['http://*:3000'] });
app->secrets(['commutes rock']);
app->start;

