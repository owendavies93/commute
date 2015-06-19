use Mojolicious::Lite;

plugin 'basic_auth';

under sub {
    my $c = shift;
    my $access = $c->basic_auth(
        realm => sub { return 1 if "@_" eq "odavies testing123" }
    );
    return 1 if $access;
    $c->render(template => 'nope');
    return undef;
};

get '/' => { json => { foo => [1, 'bar'] } };

get '/commutes/' => { json => { foo => 'holla holla' } };

app->start;

__DATA__

@@ nope.html.ep
Nope.
