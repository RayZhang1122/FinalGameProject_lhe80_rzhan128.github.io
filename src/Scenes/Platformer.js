class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");

        this.score = 0;
        this.scoreNum = 0;
        this.lives = 3;
        this.livesNum = null;
        this.invincible;
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 5550;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;// 跳跳果实后重力为1000
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 1.5;
        this.invincible= false;
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.audio("wins", ["jingles_SAX16.ogg"]);
        this.load.audio("jumps", ["error_004.mp3"]);
        this.load.audio("collects", ["collects.ogg"]);
        this.load.audio("dies", ["激光.ogg"]);
        this.load.audio("power", ["power.mp3"]);
    }

    create() {
        this.map = this.add.tilemap("platformer-level-1", 16, 16, 100, 20);
        this.physics.world.setBounds(0,0, 100*18 , 20*18);
        this.tilesetkenny = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.tilesetBack = this.map.addTilesetImage("2D Space Station Tile Set Assets", "2D Space Station Tile Set Assets");
        this.tilesetSpace = this.map.addTilesetImage("space_tileset", "space_tileset");
        this.tilesetWall = this.map.addTilesetImage("Space-wall-Tileset", "Space-wall-Tileset");
        this.tilesetTraps = this.map.addTilesetImage("traps", "traps");
        

        // Create a layer
        this.backLayer = this.map.createLayer("Background", [this.tilesetBack, this.tilesetSpace, this.tilesetWall], 0, 0);//background layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", [this.tilesetWall, this.tilesetTraps], 0, 0);
        this.backitemLayer = this.map.createLayer("Background_frontItems", this.tilesetTraps, 0, 0);//background layer
        this.spikesLayer = this.map.createLayer("SpikesLayer", this.tilesetTraps, 0, 0);// 一碰就死
        this.fireLayer = this.map.createLayer("FireLayer", this.tilesetTraps, 0, 0);
        
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.spikesLayer.setCollisionByProperty({
            collides: true
        });

        this.fireLayer.setCollisionByProperty({
            collides: true
        });

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });




        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        this.coinGroup = this.add.group(this.coins);

        my.sprite.player = this.physics.add.sprite(10, 180, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.spikesLayer, this.playerHitSpikes, null, this);
        this.physics.add.collider(my.sprite.player, this.fireLayer, this.playerHitFire, null, this);

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy();
            this.score += 1;
            this.scoreNum.setText(this.score.toString());
            const collects = this.sound.add("collects");
            collects.play(); 
        });

        this.flag = this.map.createFromObjects("Objects", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 112
        });

        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);
        
        this.physics.add.overlap(my.sprite.player, this.flag, (obj1, obj2) => {
            const wins = this.sound.add("wins");
            wins.play();
            const endText = this.add.text(1320, 100, "YOU WIN", {
                fontFamily: "Arial",
                fontSize: 48,
                color: "#1ABC9C"
            });
            this.add.text(1162, 150, "COINS COLLECTED: " + this.score, {
                fontFamily: "Arial",
                fontSize: 48,
                color: "#17202A"
            });
            const newScene = this.add.text(1200, 200, "CLICK TO RESTART", {
                fontFamily: "Arial",
                fontSize: 48,
                color: "#FF1166"
            });

            my.sprite.player.setVelocity(0, 0);
            my.sprite.player.body.moves = false;

            this.input.once("pointerdown", function () {
                this.score = 0;
                this.scoreNum = 0;
                this.lives = 3;
                this.livesNum.setText(this.lives.toString());
                this.scene.restart();
            }, this);
        });


        this.powerups = this.map.createFromObjects("powerup", {
            name: "uparrow",
            key: "traps",
            frame: 662
        });

        this.physics.world.enable(this.powerups, Phaser.Physics.Arcade.STATIC_BODY);
        this.powerGroup = this.add.group(this.powerups);
        
        this.physics.add.overlap(my.sprite.player, this.powerGroup, (obj1, obj2) => {
            obj2.destroy();
            const power = this.sound.add("power");
            power.play();
            this.JUMP_VELOCITY -= 100;
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['dirt_01.png', 'dirt_03.png'],
            random: true,
            scale: {start: 0.03, end: 0.08},
            maxAliveParticles: 5,
            lifespan: 350,
            gravityY: -40,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['muzzle_01.png', 'muzzle_05.png'],
            //Try: add random: true 
            scale: {start: 0.1, end: 0.03},
            //Try: maxAliveParticles: 8,
            maxAliveParticles: 1,
            lifespan: 500,
            //Try: gravityY: -400,
            gravityY: 40,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.jumping.stop();

        //camera code here
        this.cameras.main.setBounds(0, 0, 100*18 , 20*18);
        this.cameras.main.startFollow(my.sprite.player, true, 0.2, 0.2);
        this.cameras.main.setDeadzone(400, 200);
        this.cameras.main.setZoom(2);
    
        this.add.text(15, 350, "Coins: ", {
            fontFamily: "Arial",
            fontSize: 23,
            color: "#2ECC71"
        });
        this.scoreNum = this.add.text(85, 350, this.score.toString(), {
            fontFamily: "Arial",
            fontSize: 23,
            color: "#FFAA00"
        });
        const livesText = this.add.text(15, 374, "Lives: ", {
            fontFamily: "Arial",
            fontSize: 23,
            color: "#2ECC71"
        });
        this.livesNum = this.add.text(85, 374, this.lives.toString(), {
            fontFamily: "Arial",
            fontSize: 23,
            color: "#1E90FF"
        });
    }

    playerHitSpikes(player, spikes) {
        if (!this.invincible) { // 如果不是无敌状态
            this.lives -= 1;
            this.livesNum.setText(this.lives.toString());
            this.invincible = true; // 设置为无敌状态
            // 播放受伤音效
            const dies = this.sound.add("dies");
            dies.play();

            // 设定1秒后取消无敌状态
            this.time.delayedCall(1000, () => {
                this.invincible = false;
            }, [], this);

            // 如果生命值为0，则重新启动场景
            if (this.lives === 0) {
                this.lives = 3;
                this.score = 0;
                this.scoreNum = 0;
                this.scene.start("endingScene");
            }
        }

    }

    playerHitFire(player, fire) {
        // hit fire and restart the scene.
        this.lives = 3;
        this.score = 0;
        this.scoreNum = 0;
        this.scene.start("endingScene");
    }

    update() {
        if(cursors.left.isDown) {
            this.cameras.main.scrollX -= 4;
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-5, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
            

        } else if(cursors.right.isDown) {
            this.cameras.main.scrollX += 4;
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-15, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        // player jump
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey))
        {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2 - 10, my.sprite.player.displayHeight/2-10, false);
            my.vfx.jumping.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            const jumps = this.sound.add("jumps");
            jumps.play();
            
            if (my.sprite.player.body.blocked.down) {

                my.vfx.jumping.start();

            }
        };
        this.input.keyboard.on('keyup-SPACE', event =>
        {
            my.vfx.jumping.stop();
        });


        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.score = 0;
            this.scoreNum = 0;
            this.scene.restart();
        }

        

    }
}
