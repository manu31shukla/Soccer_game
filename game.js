let assetsLoader = {
    "background": "/assets/soccer_field.jpg",
    "player": "/assets/player.png",
    "player_team": "/assets/player_team.png",
    "enemy_team": "/assets/enemy_team.png",
    "ball": "/assets/ball.png",
    "goal1": "/assets/goal.png",
    "goal2": "/assets/goal2.png",
};

let soundsLoader = {
    "background": "/assets/background.wav",
    "whistle": "/assets/whiste.wav",
    "success": "/assets/goal.wav",
    "lose": "/assets/goal.wav",
    "goal": "/assets/goal.wav",
};

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.playerTeam = [];
        this.enemyTeam = [];
        this.ball = null;
        this.playerGoal = null;
        this.enemyGoal = null;
        this.gameOver = false;
        this.playerCharacter = null;
        this.cursors = null;
        this.playerScore = 0;
        this.enemyScore = 0;
        this.scoreText = null;
        this.timeText = null;
        this.difficultyText = null;
        this.remainingTime = 90;
        this.movementEnabled = false;
        this.countdownText = null;
        this.roundNumber = 1;
        this.timeEvent = null;
        this.lastRoundplayerScore = 0;
        this.lastRoundenemyScore = 0;
        this.roundEnding = false;
        this.currentDifficulty = 1.00;
        this.bestClear = 0;
        this.bestClearText = null;
        this.lastScoringTeam = null;
        this.isPaused = false;
    }
    preload() {
        displayProgressLoader.call(this);
        for (const key in assetsLoader) {
            this.load.image(key, assetsLoader[key]);
        }
        
          for (const key in soundsLoader) {
            this.load.audio(key, soundsLoader[key]);
          }
        
          this.load.image("pauseButton", "https://img.icons8.com/?size=100&id=AibrGCLNeCYz&format=png&color=ffffff");
          this.load.image("resumeButton", "https://img.icons8.com/?size=100&id=398&format=png&color=ffffff");

          const fontName = 'pix';
          const fontBaseURL = "https://aicade-ui-assets.s3.amazonaws.com/GameAssets/fonts/"
          this.load.bitmapFont('pixelfont', fontBaseURL + fontName + '.png', fontBaseURL + fontName + '.xml');
  
    }

    create() {
        //pause button
        this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
        this.pauseButton = this.add.image(this.game.config.width - 60, 60, "pauseButton");
        this.pauseButton.setInteractive({ cursor: 'pointer' });
        this.pauseButton.setScale(1).setScrollFactor(0).setDepth(11);
        this.pauseButton.on('pointerdown', () => this.togglePause());

        //screen dimensions
        const screenWidth = this.game.config.width;
        const screenHeight = this.game.config.height;

        //Sound

        this.sounds = {};
        for (const key in soundsLoader) {
        this.sounds[key] = this.sound.add(key, { loop: false, volume: 0.5 });
        }
        // this.sounds.whistle.setVolume(0.5).setLoop(false).play();
        this.sounds.background.setVolume(1.5).setLoop(true).play();


        // Background image
        this.bg = this.add.sprite(0, 0, 'background').setOrigin(0, 0);
        const scale = Math.max(this.game.config.width / this.bg.displayWidth, this.game.config.height / this.bg.displayHeight);
        this.bg.setScale(scale);        
        this.over = false;
        this.playerTeam = [];
        this.enemyTeam = [];
        this.playerScore = 0;
        this.enemyScore = 0;
        this.remainingTime = 90;
        this.movementEnabled = false;
        this.roundNumber = 1;
        this.lastRoundplayerScore = 0;
        this.lastRoundenemyScore = 0;
        this.roundEnding = false;

        // Create goals with images
        this.playerGoal = this.add.image(0, screenHeight / 2, "goal1").setOrigin(0, 0.5).setDisplaySize(100, screenHeight);;
        this.enemyGoal = this.add.image(screenWidth, screenHeight / 2, "goal2").setOrigin(1, 0.5).setDisplaySize(100, screenHeight);;

        // Set physics properties for goals
        this.physics.world.enable(this.playerGoal);
        this.physics.world.enable(this.enemyGoal);
        this.playerGoal.body.setImmovable(true);
        this.enemyGoal.body.setImmovable(true);

        // Create ball
        this.ball = this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'ball');
        this.ball.setOrigin(0.5, 0.5);
        this.ball.setDisplaySize(30, 30);
        this.physics.add.existing(this.ball);
        this.ball.body.setCollideWorldBounds(true, 1, 1);
        this.ball.body.setBounce(0.9, 0.9);
        this.ball.body.setDamping(true);
        this.ball.body.setDrag(0.95);
        this.ball.body.setMass(0.5);

        this.playerCharacter = this.createPlayer(screenWidth * 0.3125, screenHeight / 2, 'player', true, false, false, 'forward', 70, 70);

        // Create player team players
        this.playerTeam.push(this.createPlayer(screenWidth * 0.1875, screenHeight * 0.3333, 'player_team', false, false, false, 'aggressive', 50, 50));
        this.playerTeam.push(this.createPlayer(screenWidth * 0.1875, screenHeight * 0.6667, 'player_team', false, false, false, 'aggressive', 50, 50));
        this.playerTeam.push(this.createPlayer(screenWidth * 0.125, screenHeight * 0.4167, 'player_team', false, false, false, 'defender', 40, 40));
        this.playerTeam.push(this.createPlayer(screenWidth * 0.125, screenHeight * 0.5833, 'player_team', false, false, false, 'defender', 40, 40));
        this.playerTeam.push(this.createPlayer(screenWidth * 0.09375, screenHeight / 2, 'player_team', false, true, false, 'goalie', 70, 70));

        // Create enemy team players
        this.enemyTeam.push(this.createPlayer(screenWidth * 0.6875, screenHeight / 2, 'enemy_team', false, false, false, 'forward', 60, 60));
        this.enemyTeam.push(this.createPlayer(screenWidth * 0.8125, screenHeight * 0.3333, 'enemy_team', false, false, false, 'aggressive', 50, 50));
        this.enemyTeam.push(this.createPlayer(screenWidth * 0.8125, screenHeight * 0.6667, 'enemy_team', false, false, false, 'all-rounder', 50, 50));
        this.enemyTeam.push(this.createPlayer(screenWidth * 0.875, screenHeight * 0.4167, 'enemy_team', false, false, false, 'defender', 40, 40));
        this.enemyTeam.push(this.createPlayer(screenWidth * 0.875, screenHeight * 0.5833, 'enemy_team', false, false, false, 'defender', 40, 40));
        this.enemyTeam.push(this.createPlayer(screenWidth * 0.90625, screenHeight / 2, 'enemy_team', false, true, false, 'goalie', 70, 70));

        // Set up collisions
        
        this.physics.add.collider(this.playerTeam, this.ball, this.handleKick, null, this);
        this.physics.add.collider(this.enemyTeam, this.ball, this.handleKick, null, this);
        this.physics.add.collider(this.playerTeam, this.enemyTeam, this.handleCollision, null, this);
        this.physics.add.collider(this.playerTeam, this.playerTeam, this.handleCollision, null, this);
        this.physics.add.collider(this.enemyTeam, this.enemyTeam, this.handleCollision, null, this);
        this.playerTeam.forEach(player => {
            this.physics.add.collider(player, this.playerTeam);
        });
        this.enemyTeam.forEach(player => {
            this.physics.add.collider(player, this.enemyTeam);
        });
        
        // Set up collisions for player
        this.physics.add.collider(this.playerCharacter, this.ball);
        this.physics.add.collider(this.playerCharacter, this.playerTeam);
        this.physics.add.collider(this.playerCharacter, this.enemyTeam);
        // Goal detection
        this.physics.add.overlap(this.ball, this.playerGoal, this.scoreGoal, null, this);
        this.physics.add.overlap(this.ball, this.enemyGoal, this.scoreGoal, null, this);

        this.physics.add.overlap(this.playerTeam, this.enemyTeam, this.handleOverlap, null, this);
        this.physics.add.overlap(this.playerTeam, this.playerTeam, this.handleOverlap, null, this);
        this.physics.add.overlap(this.enemyTeam, this.enemyTeam, this.handleOverlap, null, this);
        this.physics.add.overlap(this.playerCharacter, this.playerTeam, this.handleOverlap, null, this);
        this.physics.add.overlap(this.playerCharacter, this.enemyTeam, this.handleOverlap, null, this);



        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();

        // UI elements
        this.scoreText = this.add.bitmapText(screenWidth / 2, 20, 'pixelfont', 'Player: 0 - Enemy: 0', 20).setOrigin(0.5);
        this.timeText = this.add.bitmapText(screenWidth / 2, 45, 'pixelfont', 'Time: 90.00', 20).setOrigin(0.5);
        // this.difficultyText = this.add.bitmapText(screenWidth / 2, 70, 'pixelfont', `Difficulty: ${this.currentDifficulty.toFixed(2)}`, 18).setOrigin(0.5);
        // this.bestClearText = this.add.bitmapText(screenWidth / 2, 90, 'pixelfont', 'Best Clear: 0.00', 18).setOrigin(0.5);
        this.countdownText = this.add.bitmapText(screenWidth / 2, screenHeight - 50, 'pixelfont', '', 64).setOrigin(0.5);
        this.add.bitmapText(screenWidth / 2, screenHeight - 20, 'pixelfont', 'Arrow keys to move', 18).setOrigin(0.5);
        this.finalText = this.add.bitmapText(screenWidth / 2, screenHeight/2, 'pixelfont', `Well Played`, 28).setOrigin(0.5).setAlpha(0);


        this.physics.world.setBounds(40, 0, screenWidth-80, screenHeight);
        this.startRoundCountdown();

    }

    createPlayer(x, y, key, isPlayer, isGoalie, isSneaky, role, width = 50, height = 50) {
        let player = this.add.image(x, y, key);
        this.physics.add.existing(player);
        player.body.setCollideWorldBounds(true);
        player.setDisplaySize(width, height);
    
        player.isPlayer = isPlayer;
        player.isGoalie = isGoalie;
        player.isSneaky = isSneaky;
        player.role = role;
        player.team = key.includes('player') ? 'player' : 'enemy';
    
        // AI control logic for non-player controlled characters
        if (!isPlayer) {
            player.update = () => {
                let targetGoal;
                if (player.team === 'player') {
                    targetGoal = this.enemyGoal;
                } else {
                    targetGoal = this.playerGoal;
                }
    
                const ballDirection = new Phaser.Math.Vector2(this.ball.x - player.x, this.ball.y - player.y).normalize();
                let targetDirection = new Phaser.Math.Vector2(targetGoal.x - player.x, targetGoal.y - player.y).normalize();
    
                switch (player.role) {
                    case 'forward':
                        if (Phaser.Math.Distance.Between(player.x, player.y, this.ball.x, this.ball.y) < 150) {
                            player.body.velocity.x = ballDirection.x * 250;
                            player.body.velocity.y = ballDirection.y * 250;
                        } else {
                            player.body.velocity.x = targetDirection.x * 200;
                            player.body.velocity.y = targetDirection.y * 200;
                        }
                        break;
    
                    case 'aggressive':
                        player.body.velocity.x = ballDirection.x * 200;
                        player.body.velocity.y = ballDirection.y * 200;
                        break;
    
                    case 'all-rounder':
                        player.body.velocity.x = (ballDirection.x + targetDirection.x) * 0.5 * 180;
                        player.body.velocity.y = (ballDirection.y + targetDirection.y) * 0.5 * 180;
                        break;
    
                    case 'defender':
                        if (Phaser.Math.Distance.Between(player.x, player.y, this.ball.x, this.ball.y) < 200) {
                            player.body.velocity.x = ballDirection.x * 180;
                            player.body.velocity.y = ballDirection.y * 180;
                        } else {
                            player.body.velocity.set(0, 0);
                        }
                        break;
    
                        case 'goalie':
                            const goalieArea = player.team === 'player' ? this.playerGoal : this.enemyGoal;
                            const distanceToBall = Phaser.Math.Distance.Between(player.x, player.y, this.ball.x, this.ball.y);
                            
                            if (distanceToBall < 200) {
                                player.body.velocity.x = ballDirection.x * 180;
                                player.body.velocity.y = ballDirection.y * 180;
                            } else {
                                const goalieSpeed = 150; 
                                const yDifference = this.ball.y - player.y;
                                
                                if (Math.abs(yDifference) > 10) { 
                                    player.body.velocity.y = Phaser.Math.Clamp(yDifference * 0.5, -goalieSpeed, goalieSpeed);
                                } else {
                                    player.body.velocity.y = 0;
                                }
                        
                                if (player.y < goalieArea.y - goalieArea.height / 2) {
                                    player.y = goalieArea.y - goalieArea.height / 2;
                                    player.body.velocity.y = 0;
                                } else if (player.y > goalieArea.y + goalieArea.height / 2) {
                                    player.y = goalieArea.y + goalieArea.height / 2;
                                    player.body.velocity.y = 0;
                                }
                            }
                            player.body.velocity.x = 0;
                            break;
                        
                }
            };
        }
    
        return player;
    }

    handleOverlap(obj1, obj2) {
        const overlapX = obj2.x - obj1.x;
        const overlapY = obj2.y - obj1.y;
        
        if (Math.abs(overlapX) > Math.abs(overlapY)) {
            obj1.x -= overlapX / 4;
            obj2.x += overlapX / 4;
        } else {
            obj1.y -= overlapY / 4;
            obj2.y += overlapY / 4;
        }
        
        obj1.body.velocity.x *= -.5;
        obj1.body.velocity.y *= -.5;
        obj2.body.velocity.x *= -.5;
        obj2.body.velocity.y *= -.5;
    }

    kick(circle, goal) {
        if (circle.isGoalie) {
            return;
        }
        const angle = Phaser.Math.Angle.Between(circle.x, circle.y, this.ball.x, this.ball.y);
        const speed = 300 * circle.speedMultiplier;
        this.ball.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
    }

    handleKick(circle, ball) {
        if (circle.isPlayer) {
            if (this.cursors.space.isDown) {
                this.kick(circle, (circle.team=='player'? this.enemyGoal: this.playerGoal));
            }
        }
    }
    
    handleCollision(player, ball) {
        if (!this.roundEnding) {
            let angle = Phaser.Math.Angle.Between(player.x, player.y, ball.x, ball.y);
    
            let speed = 250;
    
            ball.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
    }
    
    update(time, delta) {
        if (this.over) return;
    
        if (this.movementEnabled) {
            this.ball.body.setAngularVelocity(100);
            this.playerCharacter.body.setVelocity(0);

        // Check for cursor key presses and move the player accordingly
        if (this.cursors.left.isDown) {
            this.playerCharacter.body.setVelocityX(-250);
        } else if (this.cursors.right.isDown) {
            this.playerCharacter.body.setVelocityX(250);
        }

        if (this.cursors.up.isDown) {
            this.playerCharacter.body.setVelocityY(-250);
        } else if (this.cursors.down.isDown) {
            this.playerCharacter.body.setVelocityY(250);
        }

        // Optionally, limit diagonal speed for more consistent movement
        this.playerCharacter.body.velocity.normalize().scale(200);
            this.playerTeam.forEach(player => {
                player.update && player.update();
            });
            this.enemyTeam.forEach(player => {
                player.update && player.update();
            });
    
        }
    
        this.ball.x = Phaser.Math.Clamp(this.ball.x, 0, 1280);
        this.ball.y = Phaser.Math.Clamp(this.ball.y, 0, 720);
    
        this.timeText.setText(`Time: ${this.remainingTime.toFixed(2)}`);
    }

    scoreGoal(ball, goal) {
        this.sounds.goal.setVolume(0.5).setLoop(false).play();

        if (goal === this.playerGoal) {
            this.enemyScore++;
            this.sounds.whistle.setVolume(0.5).setLoop(false).play();            
            console.log('enemy score');
            this.lastScoringTeam = 'enemy';
        } else if (goal === this.enemyGoal) {
            this.playerScore++;
            this.sounds.whistle.setVolume(0.5).setLoop(false).play();

            console.log('player score');
            this.lastScoringTeam = 'player';
        }


        this.scoreText.setText(`Player: ${this.playerScore} - Enemy: ${this.enemyScore}`);
        this.stopAllPlayerMovement();
        this.resetBall();
        this.resetPlayers();
        this.movementEnabled = false;
        this.time.addEvent({
            delay: 2000, 
            callback: () => {  
                this.movementEnabled = true; 
            },
            callbackScope: this,
            loop: false
        });
    }

    startRoundCountdown() {
        const countdownValues = [1, 2, 3];
        
        this.countdownText.setText(`Game starts`).setPosition(this.game.config.width / 2, this.game.config.height / 2);
        
        this.time.addEvent({
            delay: 1000,
            callback: () => this.countdownText.setText(countdownValues.pop()),
            callbackScope: this,
            loop: true,
            repeat: countdownValues.length - 1
        });
            this.sounds.whistle.setVolume(0.5).setLoop(false).play();

    
        this.time.addEvent({
            delay: 4000, 
            callback: () => {
                this.countdownText.setText(''); 
                this.movementEnabled = true;
                this.timeEvent = this.time.addEvent({
                    delay: 10,
                    callback: this.updateTime,
                    callbackScope: this,
                    loop: true
                });
            },
            callbackScope: this
        });
    }
    

    updateTime() {
        this.remainingTime -= 0.01;
        if (this.remainingTime >= 0) {
            this.timeText.setText(`Time: ${this.remainingTime.toFixed(2)}`);
        }
        if (this.remainingTime <= 0) {
            this.remainingTime = 0;
            this.timeText.setText(`Time: 0.00`);
            this.endRound();
        }
    }

    resetBall() {
        this.ball.setPosition(this.game.config.width/2, this.game.config.height/2);
        this.ball.body.setVelocity(0, 0);
    }

    resetPlayers() {
        const { width, height } = this.game.config;
        const playerTeamPositions = [
            { x: width * 0.1875, y: height * 0.3333 },
            { x: width * 0.1875, y: height * 0.6667 },
            { x: width * 0.125, y: height * 0.4167 },
            { x: width * 0.125, y: height * 0.5833 },
            { x: width * 0.09375, y: height / 2 }
        ];
    
        const enemyTeamPositions = [
            { x: width * 0.6875, y: height / 2 },
            { x: width * 0.8125, y: height * 0.3333 },
            { x: width * 0.8125, y: height * 0.6667 },
            { x: width * 0.875, y: height * 0.4167 },
            { x: width * 0.875, y: height * 0.5833 },
            { x: width * 0.90625, y: height / 2 }
        ];
    
        this.playerTeam.forEach((player, index) => {
            if (player) {
                player.setPosition(playerTeamPositions[index].x, playerTeamPositions[index].y);
                player.body.setVelocity(0, 0);
            }
        });
            this.enemyTeam.forEach((player, index) => {
            if (player) {
                player.setPosition(enemyTeamPositions[index].x, enemyTeamPositions[index].y);
                player.body.setVelocity(0, 0);
            }
        });
            this.playerCharacter.setPosition(width * 0.3125, height / 2);
        this.playerCharacter.body.setVelocity(0, 0);
    }

    stopAllPlayerMovement() {
        [...this.playerTeam, ...this.enemyTeam].forEach(player => {
            player.body.setVelocity(0, 0);
        });
        this.ball.body.setVelocity(0, 0);
    }

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    pauseGame() {
        this.isPaused = true;
        this.physics.pause();
        this.timeEvent.paused = true;
        this.sounds.background.pause(); 
        this.pauseButton.setTexture('resumeButton'); 
    }
    
    resumeGame() {
        this.isPaused = false;
        this.timeEvent.paused = false;
        this.physics.resume();
        this.sounds.background.resume(); 
        this.pauseButton.setTexture('pauseButton'); 
    }
    

    endRound() {
        this.sounds.background.stop();
        const winner = this.playerScore > this.enemyScore ? 'Player team' : 'Enemy team';
        if(winner === 'Player team') this.sounds.success.setVolume(1).setLoop(false).play()
        else this.sounds.lose.setVolume(1).setLoop(false).play()
        this.movementEnabled = false;
        this.stopAllPlayerMovement();
        this.over = true;
        this.time.removeEvent(this.timeEvent);
        this.timeEvent = null;
        this.finalText.setAlpha(1);
        this.countdownText.setText(`Game Over!`);
        this.scoreText.setText(`Final Score - Player: ${this.playerScore} - Enemy: ${this.enemyScore}`);
    }  
};


function displayProgressLoader() {
    let width = 320;
    let height = 50;
    let x = (this.game.config.width / 2) - 160;
    let y = (this.game.config.height / 2) - 50;

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(x, y, width, height);

    const loadingText = this.make.text({
        x: this.game.config.width / 2,
        y: this.game.config.height / 2 + 20,
        text: 'Loading...',
        style: {
            font: '20px monospace',
            fill: '#ffffff'
        }
    }).setOrigin(0.5, 0.5);
    loadingText.setOrigin(0.5, 0.5);

    const progressBar = this.add.graphics();
    this.load.on('progress', (value) => {
        progressBar.clear();
        progressBar.fillStyle(0x364afe, 1);
        progressBar.fillRect(x, y, width * value, height);
    });
    this.load.on('complete', function () {
        progressBar.destroy();
        progressBox.destroy();
        loadingText.destroy();
    });
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    dataObject: {
      name: 'Soccer game',
      description: 'use arrow keys to move the player ',
      instructions: 'try to score goals',
    },
    orientation: "landscape" 
  };
  let game = new Phaser.Game(config);