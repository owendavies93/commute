use Mojolicious::Lite;

plugin 'basic_auth';
plugin 'database', {
    dsn      => 'dbi:mysql:commute:',
    username => 'odavies',
    password => 'testing123',
};

under sub {
    my $c = shift;
    my $access = $c->basic_auth(
        realm => sub { return 1 if "@_" eq "odavies testing123" }
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

    my $status = $c->db->do(
        'INSERT INTO commutes (start_time) VALUES (CURRENT_TIMESTAMP)');
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
    return $c->render(json => { message => ($status ? 'Ended' : 'Failed') });
};

app->secrets(['commutes rock']);
app->start;

