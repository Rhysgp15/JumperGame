var game;

class preloadGame extends Phaser.Scene 
{
    constructor() {
        super("PreloadGame");
    }

    preload() {
        //preload background
        this.load.image('background', 'assets/Images/Background/bg_layer1.png')
        //platfrom
        this.load.image('platform', 'assets/Images/Environment/ground_grass.png')

        //Frog Idle animation
        this.load.spritesheet('playerFrog_sp', 'assets/Images/MainCharacters/NinjaFrog/NinjaFrogSpriteSheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        //Items
        this.load.image('coin', 'assets/Images/Items/gold_1.png')

        //controls
        this.cursors = this.input.keyboard.createCursorKeys()

        // Enemies
        this.load.spritesheet('WingMan_sp', 'assets/Spritesheets/WingManEnemySS.png', {
            frameWidth: 220,
            frameHeight: 150
        });

        this.load.image('cloud', 'assets/Images/Enemies/cloud.png')
        this.load.image('WingManIMG', 'assets/Images/Enemies/wingMan1.png')

        //Items
        this.load.image('coin', 'assets/Images/Items/gold_1.png')

        //Sounds
        this.load.audio('music', 'assets/Sounds/music.mp3');
        this.load.audio('coinSd', 'assets/Sounds/coin.wav');
        this.load.audio('hitSd', 'assets/Sounds/hit.wav');
        this.load.audio('jumpSd', 'assets/Sounds/jump.wav');
    }

    create(){
        this.scene.start("PlayGame");
    }
}

class gameOver extends Phaser.Scene
{
    constructor()
    {
        super('game-over')
    }

    create()
    {
        const width = this.scale.width
        const height = this.scale.height

        this.add.text(width * 0.5, height * 0.5, 'Game Over', {
            fontSize: 48
        })
        .setOrigin(0.5)

        this.add.text(width * 0.43, height * 0.7, 'Press SPACE to play again!', {
            fontSize: 24
        })
        .setOrigin(0.4)

        this.input.keyboard.once('keydown_SPACE', () => {
            this.scene.start('PlayGame')
        }) //input manager to listen for the key press
    }//using the ScaleManager to get the width and height of the game instead of hard coding numbers
}

var platforms;
var timer;
var platformsPassed;
var player;
var yChangeThisUpdate;
var cursors;
var coins;
var score;
var scoreText;
var cloudEnemies;
var cloudSpawnDistance;
var wingManEnemies;
var wingManSpawnDistance;
var coinsCollected = 0;
var coinText;
var playerVelocityX = 160;
var playerVelocityY = 400;
var coinBoost = 50;
var coin;
var executed;
let mySnd = {
    music: null,
    coinSound: null,
    hitSound: null,
    jumpSound: null
};

class playGame extends Phaser.Scene 
{
    constructor() {
        super("PlayGame");
    }

    create() {
        //background
        this.add.image(240, 320, 'background')
            .setScrollFactor(1, 0)

        //ground platform
        const groundPlatform = this.physics.add.staticImage(240, 640, 'platform').setScale(1)

        //multiple platforms

        //creating platform group
        platforms = this.physics.add.staticGroup()

        //for loop to create platfroms in group
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(80, 400)
            const y = 140 * i

            const platform = platforms.create(x, y, 'platform')
            platform.scale = 0.25

            const body = platform.body
            body.updateFromGameObject()

        }

        //player
        player = this.physics.add.sprite(240, 560, 'playerFrog_sp') //new sprite called player
        this.physics.add.collider(platforms, player)
        this.physics.add.collider(groundPlatform, player)
        //Collisions - allows player to pass through platforms but stand ontop of them. 
        player.body.checkCollision.up = false
        player.body.checkCollision.left = false
        player.body.checkCollision.right = false

        // track where the player started and how much the distance has changed from that point
        player.yOrig = player.y;
        player.yChange = 0;
        player.yChangeThisUpdate = 0

        //player animation
        this.anims.create({
            key: 'frogIdle',
            frames: this.anims.generateFrameNumbers('playerFrog_sp', {
                frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'frogRun',
            frames: this.anims.generateFrameNumbers('playerFrog_sp', {
                frames: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
            }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'frogJump',
            frames: this.anims.generateFrameNumbers('playerFrog_sp', {
                start: 24,
                end: 24
            }),
            frameRate: 1,
            repeat: -1
        });
        console.log(this.textures.get('playerFrog_sp').getFrameNames());
        console.log(this.anims.generateFrameNumbers('playerFrog_sp', {
            frames: [26]
        }))

        this.anims.create({
            key: 'frogFall',
            frames: this.anims.generateFrameNumbers('playerFrog_sp', {
                frames: [23]
            }),
            frameRate: 1,
            repeat: 0
        });

        //Enemy Anims

        this.anims.create({
            key: 'WingManEnemy',
            frames: this.anims.generateFrameNumbers('WingMan_sp', {
                frames: [0, 1, 2, 3, 4, 5, 6, 7, 8]
            }),
            frameRate: 8,
            repeat: -1
        });

        //cursors
        cursors = this.input.keyboard.createCursorKeys()

        //Camera
        this.cameras.main.startFollow(player)
        this.cameras.main.setDeadzone(this.scale.width * 1.5)

        //Coins Group
        coins = this.physics.add.staticGroup({})

        //Populate Coins group
        
        for (let i = 0; i < 2; i++) {
            const x = Phaser.Math.Between(80, 400)
            const y = 160 * i

            coin = coins.create(x, y, 'coin')
            coin.scale = 0.4
            

            const body = coin.body
            body.updateFromGameObject()
            coin.disableBody(true,true)

        }
        
        this.physics.add.overlap( //tests for an overlap  between the player and the coin
            player,
            coins,
            this.handleCollectCoin,
            null,
            this
        )

        //Coin Collection Text
        const style = {
            color: '#000',
            fontsize: 24
        }
        coinText = this.add.text(240, 10, 'Coins: 0', style)
            .setScrollFactor(0)
            .setOrigin(2.5, 0)

        //Score
        score = 0

        //Score Text
        scoreText = this.add.text(300, 10, 'Score: 0', style)
            .setScrollFactor(0)
            .setOrigin(-0.5, 0)

        //Cloud Enemies
        cloudEnemies = this.physics.add.staticGroup({})

        for (let i = 0; i < 1; i++) {
            const x = Phaser.Math.Between(80, 400)
            const y = 375 * i

            const cloudEnemy = cloudEnemies.create(x, y, 'cloud')
            cloudEnemy.scale = 0.3

            const body = cloudEnemy.body
            body.updateFromGameObject()
            cloudEnemy.disableBody(true,true)
        }

        this.physics.add.overlap( //tests for an overlap  between the player and the coin
            player,
            cloudEnemies,
            this.cloudEnemyContact,
            null,
            this
        )

        //Wing man enemy
        wingManEnemies = this.physics.add.group({ allowGravity: false})

        for (let i = 0; i < 1; i++) {
            const x = 80
            const y = 200 * i

            const wingManEnemy = wingManEnemies.create(x, y, 'WingManIMG')
            wingManEnemy.scale = .5

            const body = wingManEnemy.body
            body.updateFromGameObject()
            //wingManEnemy.disableBody(true,true)
            wingManEnemies.playAnimation('WingManEnemy')
        }

        this.physics.add.overlap( //tests for an overlap  between the player and the coin
            player,
            wingManEnemies,
            this.wingManEnemyContact,
            null,
            this
        )

        //Sounds

        mySnd.music = this.sound.add('music', {loop: true, volume: 0.1})
        mySnd.coinSound = this.sound.add('coinSd', {loop: false})
        mySnd.hitSound = this.sound.add('hitSd', {loop: false})
        mySnd.jumpSound = this.sound.add('jumpSd', {loop: false})
        mySnd.music.play();
        
    }

    init() {
        coinsCollected = 0 //reset the coins collected when the game scene starts - fixes bug where it doesnt reset after game over
        score = 0
        platformsPassed = 0
        console.log(platformsPassed)
        cloudSpawnDistance = 1000;
        wingManSpawnDistance = 1400;
        timer = 0;
    }

    handleCollectCoin(player, coin) {
        
        this.physics.world.collide(player, coins, function(player, coins){
 
            if(coins.body.touching.up && player.body.touching.down){
 
                // in this case just jump again
                console.log('touching')
                player.setVelocityY(-playerVelocityY - coinBoost);
                mySnd.jumpSound.play();
            }
        }, null, this);
        
        coin.disableBody(true, true)
        mySnd.coinSound.play();
        coinsCollected++
        coinText.setText('Coins: ' + coinsCollected)

    }

    cloudEnemyContact(player, cloudEnemy){
        
        this.physics.world.collide(player, cloudEnemies, function(player, cloudEnemies){
 
            if(cloudEnemies.body.touching.up && player.body.touching.down){
 
                // in this case just jump again
                console.log('touchingEnemy')
                player.setVelocityY(-playerVelocityY - coinBoost);
                mySnd.hitSound.play();
                mySnd.jumpSound.play();
                cloudEnemy.disableBody(true, true)

            } else {
                this.playerDeath()
            }
        }, null, this);
    
    }

    wingManEnemyContact(player, wingManEnemy){
        
        this.physics.world.collide(player, wingManEnemies, function(player, wingManEnemies){
 
            if(wingManEnemies.body.touching.up && player.body.touching.down){
 
                // in this case just jump again
                console.log('touchingEnemy')
                player.setVelocityY(-playerVelocityY - coinBoost);
                mySnd.hitSound.play();
                mySnd.jumpSound.play();
                wingManEnemy.disableBody(true, true)

            } else {
                this.playerDeath()
            }
        }, null, this);
    
    }

    horizontalWrap(sprite) {
        const halfWidth = sprite.displayWidth * 0.5
        const gameWidth = game.scale.width
        if (sprite.x < -halfWidth) {
            sprite.x = gameWidth + halfWidth
        } else if (sprite.x > gameWidth + halfWidth) {
            sprite.x = halfWidth
        }
    } // If the passed in sprite goes past the left side more than half its width then teleport it to the right side plus half its width, reverse for other side
    
    scoreUpdate(){
        score = player.yChange
        scoreText.setText('Score: ' + Math.floor(score))
        
    }

    addCoin(sprite){
        coins.children.iterate(child => { //To iterate = to go over, Here we check if each platforms y is greater than the amount the camera has scolled
            const coin = child
            const y = sprite.y - 50
            const scrollY = this.cameras.main.scrollY
            if (coin.y >= scrollY + 650) {
            
                coin.enableBody(true, Phaser.Math.Between(80, 400), y, true, true);
            }
        })
    }

    addCloud(sprite){
        cloudEnemies.children.iterate(child => { //To iterate = to go over, Here we check if each platforms y is greater than the amount the camera has scolled
            const cloudEnemy = child
            const y = sprite.y - 50
            const scrollY = this.cameras.main.scrollY
            if (cloudEnemy.y >= scrollY + cloudSpawnDistance) {
                
                cloudEnemy.enableBody(true, Phaser.Math.Between(80, 400), y, true, true);
                
            }
        })
    }

    addWingMan(sprite){
        wingManEnemies.children.iterate(child => { //To iterate = to go over, Here we check if each platforms y is greater than the amount the camera has scolled
            const wingManEnemy = child
            const y = sprite.y - 75
            const scrollY = this.cameras.main.scrollY
            if (wingManEnemy.y >= scrollY + wingManSpawnDistance) {
                
                wingManEnemy.enableBody(true, Phaser.Math.Between(80, 400), y, true, true);
                
            }
        })
    }

    spawners(){
        if(player.yChange % 1000 === 0){
            cloudSpawnDistance = cloudSpawnDistance * 0.95
            console.log(cloudSpawnDistance)
        }
    }
    
    update(time, delta) {
        //timer
        /*
        timer +=delta;
        while(timer >= 3){
            wingManEnemies.setVelocityX(50)
        } while( timer >= 6) {
            wingManEnemies.setVelocityX(-50)
        }

        if(timer = 6){
            timer = 0
        }
        */

        //player movement
        if (cursors.left.isDown) {
            player.setVelocityX(-playerVelocityX);
            player.setFlipX(true);
            player.anims.play('frogRun', true);

        } else if (cursors.right.isDown) {
            player.setVelocityX(playerVelocityX);
            player.setFlipX(false);
            player.anims.play('frogRun', true);

        } else {
            player.setVelocityX(0);
            player.anims.play('frogIdle');
        }

        if (cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(-playerVelocityY);
            mySnd.jumpSound.play();

        }
        if (!player.body.touching.down && -playerVelocityY) {
            player.anims.play('frogJump');
            
        }

        if (!player.body.touching.down && player.body.velocity.y > 0) {
            player.anims.play('frogFall');
        }

        this.horizontalWrap(player)

        platforms.children.iterate(child => { //To iterate = to go over, Here we check if each platforms y is greater than the amount the camera has scolled
            const platform = child

            const scrollY = this.cameras.main.scrollY
            if (platform.y >= scrollY + 650) {
                platform.x = Phaser.Math.Between(80, 400)
                platform.y = scrollY - Phaser.Math.Between(40, 50) // If platform y is greater than scrollY then it will be moved to between 0 and 10 pixeles above the camera
                platform.body.updateFromGameObject()
                platformsPassed++
                console.log(platformsPassed)
                this.addCoin(platform)
                this.addCloud(platform)
                this.addWingMan(platform)

            }
        })

        
        wingManEnemies.setVelocityX(50)
        /*
        this.add.tween({
            targets: wingManEnemies.getChildren().map(function (wingManEnemies) { return wingManEnemies.body.velocity }),
            x: +50,
            yoyo: true
            //y: Y,
            // …
        });
        */

        // track the maximum amount that the hero has travelled
        player.yChange = Math.max(player.yChange, Math.abs(player.y - player.yOrig));
        player.yChangeThisUpdate = Math.max(player.yChange, Math.abs(player.y - player.yOrig));

        //score
        this.scoreUpdate()

        
        /* 
        if (score >=1000 && !executed)  
        {
            cloudSpawnDistance = cloudSpawnDistance * 0.9; 
            console.log(cloudSpawnDistance)
            executed = true;
        }
        */

        //Game over
        const bottomPlatform = this.findBottomMostPlatform()
        if(player.y > bottomPlatform.y + 200)
        {
            //console.log('game over')
            this.playerDeath()
        }
        //this.spawners()
    }
    
    playerDeath(){
        this.scene.start('game-over')
        mySnd.music.stop();
    }
   
    findBottomMostPlatform()
    {
        const platformsGp = platforms.getChildren()
        let bottomPlatform = platformsGp[0] //get all platforms as an array

        for(let i = 1; i < platformsGp.length; ++i) //pick first platform in array as bottom most platform 
        {
            const platform = platformsGp[i]

            if (platform.y < bottomPlatform.y)
            {
                continue
            }

            bottomPlatform = platform // iterate over array and compare against current bottom platform
        } // If a platform’s y position is greater than the bottomPlatform then we set it as the new bottomPlatform

        return bottomPlatform
    }

}

window.onload = function(){
    var config = {
        type: Phaser.AUTO,
        width: 480,
        height: 640,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    y: 400
                },
                debug: true
    
            }
        },
        scene: [preloadGame, playGame, gameOver]
    }
    game = new Phaser.Game(config);

}

//Set width to 480 and height 640, Phaser AUTO automatically uses Canvas or WebGL mode depending on browswer/ device

