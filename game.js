(function () {
    var Game = function (canvasId) {
        var canvas      = document.getElementById(canvasId);
        var screen      = canvas.getContext('2d');
        var gameSize    = {
            x : canvas.width,
            y : canvas.height
        };

        this.bodies = createInvaders(this).concat(new Player(this, gameSize));

        var self = this;

        loadSound('shoot.mp3', function (shootSound) {
            self.shootSound = shootSound;

            var tick = function () {
                self.update();
                self.draw(screen, gameSize);
                requestAnimationFrame(tick);
            };

            tick();
        });
    };

    Game.prototype = {
        update : function () {
            var bodies = this.bodies;
            var notCollidingWithAnything = function (body1) {
                return bodies.filter(function (body2) {
                    return colliding(body1, body2);
                }).length === 0;
            };

            this.bodies = this.bodies.filter(notCollidingWithAnything);

            for (var i = 0; i < this.bodies.length; i++) {
                this.bodies[i].update();
            }
        },
        draw : function (screen, gameSize) {
            screen.clearRect(0, 0, gameSize.x, gameSize.y);

            for (var i = 0; i < this.bodies.length; i++) {
                drawRect(screen, this.bodies[i]);
            }
        },

        addBody : function (body) {
            this.bodies.push(body);
        },

        invadersBelow : function (invader) {
            return this.bodies.filter(function (body) {
                return body instanceof Invader &&
                    body.center.y > invader.center.y &&
                    body.center.x - invader.center.x < invader.size.x;
            }).length > 0;
        }
    };

    var Player = function (game, gameSize) {
        this.game   = game;
        this.size   = { x : 15, y : 15 };
        this.center = {
            x : gameSize.x / 2,
            y : gameSize.y - this.size.x
        };
        this.keyboarder = new Keyboarder();
    };

    Player.prototype = {
        update : function () {
            if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
                this.center.x -= 2;
            } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
                this.center.x += 2;
            }

            if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
                var bullet = new Bullet({
                    x : this.center.x,
                    y : this.center.y - this.size.x / 2
                }, {
                    x : 0,
                    y : -6
                });

                this.game.addBody(bullet);
                this.game.shootSound.load();
                this.game.shootSound.play();
            }
        }
    };

    var Invader = function (game, center) {
        this.game       = game;
        this.size       = { x : 15, y : 15 };
        this.center     = center;
        this.patrolX    = 0;
        this.speedX     = 0.3;
    };

    Invader.prototype = {
        update : function () {
            // movement direction
            (this.patrolX < 0 || this.patrolX > 40) && this.speedX = -this.speedX;

            this.center.x   += this.speedX;
            this.patrolX    += this.speedX;

            if (Math.random() > 0.995 && !this.game.invadersBelow(this)) {
                var bullet = new Bullet({ // bullet position
                    x : this.center.x,
                    y : this.center.y + this.size.x / 2
                }, { // velocity
                    x : Math.random() - 0.5,
                    y : 2
                });

                this.game.addBody(bullet);
            }
        }
    };

    var createInvaders = function (game) {
        var invaders = [];

        // generating invaders
        for (var i = 0; i < 24; i++) {
            var x = 30 + (i % 8) * 30;
            var y = 30 + (i % 3) * 30;

            invaders.push(new Invader(game, { x : x, y : y }));
        }

        return invaders;
    };

    var Bullet = function (center, velocity) {
        this.size       = { x : 3, y : 3 };
        this.center     = center;
        this.velocity   = velocity;
    };

    Bullet.prototype = {
        update : function () {
            this.center.x   += this.velocity.x;
            this.center.y   += this.velocity.y;
        }
    };

    var drawRect = function (screen, body) {
        screen.fillRect(
            body.center.x - body.size.x / 2,
            body.center.y - body.size.y / 2,
            body.size.x,
            body.size.y
        );
    };

    var Keyboarder = function () {
        var keyState = {};

        window.onkeydown = function (event) {
            keyState[event.keyCode] = true;
        };

        window.onkeyup = function (event) {
            keyState[event.keyCode] = false;
        }

        this.isDown = function (keyCode) {
            return keyState[keyCode] === true;
        };

        this.KEYS =  {
            LEFT    : 37,
            RIGHT   : 39,
            SPACE   : 32
        }
    };

    var colliding = function (body1, body2) {
        return !(body1 === body2 ||
                 body1.center.x + body1.size.x / 2 < body2.center.x - body2.size.x / 2 ||
                 body1.center.y + body1.size.y / 2 < body2.center.y - body2.size.y / 2 ||
                 body1.center.x - body1.size.x / 2 > body2.center.x + body2.size.x / 2 ||
                 body1.center.y - body1.size.y / 2 > body2.center.y + body2.size.y / 2
        );
    };

    var loadSound = function (url, callback) {
        var sound   = new Audio(url);
        var loaded  = function () {
            callback(sound);
            sound.removeEventListener('canplaythrough', loaded);
        };

        sound.addEventListener('canplaythrough', loaded);
        sound.addEventListener('error', function () { console.log('error');});
        sound.load();
    };

    window.onload = function () {
        new Game('screen');
    };
})();
