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
    $c->render(template => 'nope');
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

app->secrets(['commutes rock']);
app->start;

__DATA__

@@ index.html.ep
I'm doing regression analysis on my commute!

@@ nope.html.ep
Nope.
