xdescribe('NEW TEST:', function() {

  it('Signup creates a user record', function(done) {
    var options = {
      'method': 'POST',
      'uri': 'http://127.0.0.1:4568/signup',
      'json': {'username': 'Phillip',
        'password': 'Phillip'
      }
    };

    request(options, function(error, res, body) {});

    var link = new Link({
      url: 'http://roflzoo.com/',
      title: 'Funny pictures of animals, funny dog pictures',
      baseUrl: 'http://127.0.0.1:4568'
    });
    link.save().then(function() {
      done();
    });
    
    it('Returns the same shortened code', function(done) {
      var options = {
        'method': 'POST',
        'followAllRedirects': true,
        'uri': 'http://127.0.0.1:4568/links',
        'json': {
          'url': 'http://roflzoo.com/'
        }
      };

      request(options, function(error, res, body) {});

      requestWithSession(options, function(error, res, body) {
        var code = res.body.code;
        expect(code).to.equal(link.get('code'));
        done();
      });
    });

    it('Shortcode redirects to correct url', function(done) {
      var options = {
        'method': 'GET',
        'uri': 'http://127.0.0.1:4568/' + link.get('code')
      };

      requestWithSession(options, function(error, res, body) {
        var currentLocation = res.request.href;
        expect(currentLocation).to.equal('http://roflzoo.com/');
        done();
      });
    });

    request('http://127.0.0.1:4568/logout', function(error, res, body) {});

  });

  it('New user cant access old users links', function(done) {
    var options = {
      'method': 'POST',
      'uri': 'http://127.0.0.1:4568/signup',
      'json': {'username': 'Svnh',
        'password': 'Svnh'
      }
    };

    request(options, function(error, res, body) {});

    requestWithSession(options, function(error, res, body) {
      var code = res.body.code;
      expect(code).to.equal(undefined);
      done();
    });

    // var link = new Link({
    //   url: 'http://roflzoo.com/',
    //   title: 'Funny pictures of animals, funny dog pictures',
    //   baseUrl: 'http://127.0.0.1:4568'
    // });
    // link.save().then(function() {
    //   done();
    // });
    
    // it('Returns the same shortened code', function(done) {
    //   var options = {
    //     'method': 'POST',
    //     'followAllRedirects': true,
    //     'uri': 'http://127.0.0.1:4568/links',
    //     'json': {
    //       'url': 'http://roflzoo.com/'
    //     }
    //   };

    //   request(options, function(error, res, body) {});

    //   requestWithSession(options, function(error, res, body) {
    //     var code = res.body.code;
    //     expect(code).to.equal(link.get('code'));
    //     done();
    //   });
    // });

    // it('Shortcode redirects to correct url', function(done) {
    //   var options = {
    //     'method': 'GET',
    //     'uri': 'http://127.0.0.1:4568/' + link.get('code')
    //   };

    //   requestWithSession(options, function(error, res, body) {
    //     var currentLocation = res.request.href;
    //     expect(currentLocation).to.equal('http://roflzoo.com/');
    //     done();
    //   });
    // });

    request('http://127.0.0.1:4568/logout', function(error, res, body) {});

  });



    // var options = {
    //   'method': 'POST',
    //   'uri': 'http://127.0.0.1:4568/signup',
    //   'json': {'username': 'Svnh',
    //     'password': 'Svnh'
    //   }
    // };

    // request(options, function(error, res, body) {
    //   db.knex('users')
    //     .where('username', '=', 'Phillip')
    //     .then(function(res) {
    //       if (res[0] && res[0]['username']) {
    //         var user = res[0]['username'];
    //       }
    //       expect(user).to.equal('Phillip');
    //       done();
    //     }).catch(function(err) {
    //       throw {
    //         type: 'DatabaseError',
    //         message: 'Failed to create test setup data'
    //       };
    //     });
    // });




    // it('Returns all of the links to display on the links page', function(done) {
    //   var options = {
    //     'method': 'GET',
    //     'uri': 'http://127.0.0.1:4568/links'
    //   };

    //   requestWithSession(options, function(error, res, body) {
    //     expect(body).to.include('"title":"Funny pictures of animals, funny dog pictures"');
    //     expect(body).to.include('"code":"' + link.get('code') + '"');
    //     done();
    //   });
    // });
   // 'With previously saved urls'

  // it('Signup logs in a new user', function(done) {
  //   var options = {
  //     'method': 'POST',
  //     'uri': 'http://127.0.0.1:4568/signup',
  //     'json': {
  //       'username': 'Phillip',
  //       'password': 'Phillip'
  //     }
  //   };

  //   request(options, function(error, res, body) {
  //     expect(res.headers.location).to.equal('/');
  //     done();
  //   });
  // });

}); // 'Account Creation'
