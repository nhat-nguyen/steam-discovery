(function () {
    var consoleRead = function(msg) {
        var system = require('system');
        system.stdout.writeLine(msg + ': ');
        return system.stdin.readLine();
    };

    var usage = function() {
        if (casper.cli.args.length !== 2) {
            console.log('Usage: casperjs steam-discovery.js username password');
        }
    };

    var casper = require('casper').create();

    usage();
	console.log('Please make sure to set your steam language to English, otherwise the script might not work properly');
	
    casper.options.waitTimeout = 60000;

    casper.waitForUrlChange = function(oldUrl) {
        this.waitFor(function check() {
            return oldUrl !== this.getCurrentUrl();
        });
        return this;
    };

    var url = 'https://store.steampowered.com/login/?redir=explore%2F&l=en';
    var username = casper.cli.args[0];
    var password = casper.cli.args[1];

    var login = function() {
        casper.start(url, function() {
            this.fill('form[name=logon]', {username: username, password: password}, true);
            console.log('Submitting login form...');
        });

        casper.waitFor(function() {
            return this.getElementAttribute('#login_btn_wait', 'style') !== '';
        }, function() {
            console.log('Submitted login form...');
        });
    }();

    var captcha = function() {
        casper.then(function() {
            if (this.resourceExists('rendercaptcha')) {
                var captcha = consoleRead('Captcha');
                this.fill('form[name=logon]', {username: username, password: password, captcha_text: captcha}, true);
            }
        });

        casper.then(function() {
            if (this.resourceExists('rendercaptcha')) {
                var captcha = consoleRead('Second captcha');
                this.fill('form[name=logon]', {username: username, password: password, captcha_text: captcha}, true);

                this.waitFor(function() {
					console.log('styla: ' + this.getElementAttribute('#login_btn_wait', 'style'));
                    return this.getElementAttribute('#login_btn_wait', 'style') !== 'display: block;';
                }, function() {
                    console.log('Successfully submitting captcha...');
                });
            }
        });
    }();

    var twoFactor = function() {
        casper.then(function() {
            var hasAuth = this.evaluate(function() {
                return document.getElementsByClassName('login_modal loginTwoFactorCodeModal')[0].style.display !== 'none';
            });

            if (!hasAuth) return;

            var authCode = consoleRead('Two factor code');

            this.evaluate(function(authCode) {
                document.getElementById('twofactorcode_entry').value = authCode;
            }, authCode);
			
            this.clickLabel('my authenticator code','div');
			
            casper.waitFor(function() {
                return this.getElementAttribute('#login_btn_wait', 'style') === 'display: none;';
            }, function() {
				var wrongAuth = this.evaluate(function() {
					return document.getElementById('login_twofactorauth_message_incorrectcode').style.display !== 'none';
				});
			if (wrongAuth) {
				console.log('Auth went wrong, program will stop shortly');
				return;
			} else {
                console.log('Successfully logged in...');
            }
			});
        });
    }();
	
	//might not work properly
	var steamGuard = function() {
        casper.then(function() {
            var hasAuth = this.evaluate(function() {
                return document.getElementsByClassName('login_modal loginAuthCodeModal')[0].style.display !== 'none';
            });

            if (!hasAuth) return;

            var authCode = consoleRead('Authentication code');

            this.evaluate(function(authCode) {
                document.getElementById('authcode').value = authCode;
            }, authCode);

            this.clickLabel('my special access code');
            casper.waitFor(function() {
                return this.getElementAttribute('#auth_buttonset_waiting', 'style') === 'display: none; ';
            }, function() {
                console.log('Successfully logged in...');
            });
        });
    }();
	//
	
    var startQueue = function() {
        casper.thenOpen('http://store.steampowered.com/explore/?l=en');
		
        casper.then(function() {
            if (this.getElementAttribute('#discovery_queue_ctn', 'style') === 'display: none;') {
                var oldUrl = this.getCurrentUrl();
                this.click('#refresh_queue_btn');
                this.clickLabel('Start another queue >>');
                console.log('Getting new queue...');
                this.waitForUrlChange(oldUrl);
            } else {
                var link = this.getElementAttribute('#discovery_queue_start_link', 'href');
                this.thenOpen(link + '?l=en');
                console.log('Starting the queue at ' + link);
            }
        });
    }();

    var traverseQueue = function() {
        var queue = [];
        var compensateQueue = [];
        var titleLeft = 0;

        var byPassAgeCheck = function(arr) {
			var needClick = casper.evaluate(function() {
				return document.getElementById('remember').type === 'checkbox';		//do we have a warning or a restriction?
			});
			if(needClick !== true){needClick = false;}
			
            if (casper.getCurrentUrl().indexOf('agecheck') > -1 && !needClick) {	// has age check
                console.log('Bypassing age-check...');
				
                var currentUrl = casper.getCurrentUrl();
                casper.evaluate(function() {
                    document.querySelector('select[name=ageYear]').value = 1990;
                    DoAgeGateSubmit();
                    console.log('Submitted age...');
                    return false;
                });
                if (arr !== undefined) arr.push(arr.length);
                casper.waitForUrlChange(currentUrl);
            }else if (casper.getCurrentUrl().indexOf('agecheck') > -1 && needClick){
				console.log('Bypassing age-check by clicking...');
					casper.clickLabel('Continue');
                var currentUrl = casper.getCurrentUrl();
                if (arr !== undefined) arr.push(arr.length);
                casper.waitForUrlChange(currentUrl);
			}
        };

        var traverse = function() {
            console.log('Currently at: ' + casper.getTitle());
			if (casper.getTitle() === 'Your Discovery Queue') {
				console.log('We\'re done here *flying away*');
				return;
			}
            byPassAgeCheck(compensateQueue);
            var oldUrl = casper.getCurrentUrl();
            casper.evaluate(function() { 									//
                document.getElementById('next_in_queue_form').submit();		//THIS IS WHERE THE LANGUAGE SETTINGS GET F#'D UP    nvm it's not important
            });																//
            casper.waitForUrlChange(oldUrl);
        };

        var getRemainingTitle = function() {
            var queue_sub_text = document.getElementsByClassName('queue_sub_text');
			console.log(queue_sub_text);
            if (queue_sub_text.length === 0) {
                return 1;
            } else {
                return parseInt(queue_sub_text[0].textContent.split(' ')[0].substring(1)) + 1;    
            }
        };

        casper.then(function() {
            byPassAgeCheck();
            this.then(function() {
                titleLeft = this.evaluate(getRemainingTitle);
                for (var i = 0; i < titleLeft; i++) {
                    queue[i] = i;
                }
                this.eachThen(queue, traverse);
                this.then(function() {
                    this.eachThen(compensateQueue, traverse);
                });
            });
        });
    }();

    casper.run();
})();
