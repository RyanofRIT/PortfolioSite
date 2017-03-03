// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main = {
	//  properties
    WIDTH : 640, 
    HEIGHT: 480,
    canvas: undefined,
    ctx: undefined,
   	lastTime: 0, // used by calculateDeltaTime() 
    debug: true,
		paused: false,
		animationID: 0,

		gameState: undefined,
		roundScore: 0,
		totalScore: 0,

		CIRCLE_STATE: {
			NORMAL: 0,
			EXPLODING: 1,
			MAX_SIZE: 2,
			IMPLODING: 3,
			DONE: 4
		},
		CIRCLE: Object.freeze({
			NUM_CIRCLES_START: 5,
			NUM_CIRCLES_END: 20,
			START_RADIUS: 8,
			MAX_RADIUS: 45,
			MIN_RADIUS: 2,
			MAX_LIFETIME: 2.5,
			MAX_SPEED: 80,
			EXPLOSION_SPEED: 60,
			IMPLOSION_SPEED: 84
		}),
		GAME_STATE: Object.freeze({
			BEGIN: 0,
			DEFAULT: 1,
			EXPLODING: 2,
			ROUND_OVER: 3,
			REPEAT_LEVEL: 4,
			END: 5
		}),
		circles: [],

    // methods
	init : function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		
		this.numCircles = this.CIRCLE.NUM_CIRCLES_START;
		this.circles = this.makeCircles(this.numCircles);
		this.canvas.onmousedown = this.doMousedown;
		
		this.gameState = this.GAME_STATE.BEGIN;
		this.reset();
		// start the game loop
		this.update();
	},
	reset: function(){
		this.numCircles += 5;
		this.roundScore = 0;
		this.circles = this.makeCircles(this.numCircles);
	},
	
	update: function(){
		// 1) LOOP
		// schedule a call to update()
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) PAUSED?
	 	// if so, bail out of loop
		if(this.paused){
			this.drawPauseScreen(this.ctx);
			return;
		}
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	 
	 	// 4) UPDATE
	 	// move circles
		this.moveCircles(dt);

		//CHECK FOR COLLISIONS
		this.checkForCollisions();		
	
		//did circle leave screen? then bounce
		/*
		if(this.circleHitLeftRight(this.x, this.t, this.radius)){
			this.xSpeed *=-1;
		}
		if(this.circleHitTopBottom(this.x, this.y, this.radius)){
			this.ySpeed *= -1;
		}
		*/
	 	
		// 5) DRAW	
		// i) draw background
		this.ctx.fillStyle = "black"; 
		this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT); 
	
		// ii) draw circles
		this.globalAlpha = 0.9;
		this.drawCircles(this.ctx);	
	
		// iii) draw HUD
		this.globalAlpha = 1.0;
		this.drawHUD(this.ctx);
		
		
		// iv) draw debug info
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText("dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "white");
		}
		
	},
	
	fillText: function(string, x, y, css, color) {
		this.ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		this.ctx.font = css;
		this.ctx.fillStyle = color;
		this.ctx.fillText(string, x, y);
		this.ctx.restore();
	},
	
	calculateDeltaTime: function(){
		var now,fps;
		now = performance.now(); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
	makeCircles: function(num){
		var circleMove = function(dt){
			this.x += this.xSpeed * this.speed * dt;
			this.y += this.ySpeed * this.speed * dt;
		};
		var circleDraw = function(ctx){
			ctx.save();
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
			ctx.closePath();
			ctx.fillStyle = this.fillStyle;
			ctx.fill();
			ctx.restore();
		};

		var array = [];
		for(var i =0; i < num; i++){
			var c = {};
			c.x = getRandom(this.CIRCLE.START_RADIUS * 2, this.WIDTH - this.CIRCLE.START_RADIUS * 2);
			c.y = getRandom(this.CIRCLE.START_RADIUS * 2, this.HEIGHT - this.CIRCLE.START_RADIUS * 2);

			//add a radius property
			c.radius = this.CIRCLE.START_RADIUS;

			var randomVector = getRandomUnitVector();
			c.xSpeed = randomVector.x;
			c.ySpeed = randomVector.y;

			//make more properties
			c.speed = this.CIRCLE.MAX_SPEED;
			c.fillStyle = getRandomColor();
			c.state = this.CIRCLE_STATE.NORMAL;
			c.lifetime = 0;
			c.draw = circleDraw;
			c.move = circleMove;

			Object.seal(c);
			array.push(c);
		}
		return array;
	},
	drawCircles: function(ctx){
		if(this.gameState == this.GAME_STATE.ROUND_OVER) this.ctx.globalAlpha = 0.25;
		for(var i = 0; i< this.circles.length; i++){
			var c = this.circles[i];
			if(c.state == this.CIRCLE_STATE.DONE) continue;
			c.draw(ctx);
		}
	},
	moveCircles: function(dt){
		for(var i = 0; i < this.circles.length; i++){
			var c = this.circles[i];
			if(c.state === this.CIRCLE_STATE.DONE) continue;
			if(c.state === this.CIRCLE_STATE.EXPLODING){
				c.radius += this.CIRCLE.EXPLOSION_SPEED * dt;
				if(c.radius >= this.CIRCLE.MAX_RADIUS){
					c.state = this.CIRCLE_STATE.MAX_SIZE;
				}
				continue;
			}

			if(c.state === this.CIRCLE_STATE.MAX_SIZE){
				c.lifetime += dt;
				if(c.lifetime >= this.CIRCLE.MAX_LIFETIME){
					c.state = this.CIRCLE_STATE.IMPLODING;
				}
				continue;
			}

			if(c.state === this.CIRCLE_STATE.IMPLODING){
				c.radius -= this.CIRCLE.IMPLOSION_SPEED * dt;
				if(c.radius <= this.CIRCLE.MIN_RADIUS){
					c.state = this.CIRCLE_STATE.DONE;
					continue;
				}
			}

			c.move(dt);

			if(this.circleHitLeftRight(c)) c.xSpeed *= -1;
			if(this.circleHitTopBottom(c)) c.ySpeed *= -1;
		}
	},
	circleHitLeftRight: function(c){
		if (c.x < c.radius || c.x > this.WIDTH - c.radius){
			return true;
		}
	},
	circleHitTopBottom: function(c){
		if(c.y < c.radius || c.y > this.HEIGHT - c.radius){
			return true;
		}
	},
	drawPauseScreen: function(ctx){
		ctx.save();
		ctx.fillStyle = 'black';
		ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		this.fillText('...PAUSED...', this.WIDTH/2, this.HEIGHT/2, '40pt courier', 'white');
		ctx.restore();
	},
	doMousedown: function(e){
		if(app.main.paused){
			main.paused = false;
			main.update();
			return;
		}
		if(app.main.gameState === app.main.GAME_STATE.EXPLODING) return;
		var mouse = getMouse(e);
		app.main.checkCircleClicked(mouse);
	},
	checkCircleClicked: function(mouse){
		for(var i = this.circles.length - 1; i>=0; i--){
			var c = this.circles[i];
			if( pointInsideCircle(mouse.x, mouse.y, c)){
				c.fillStyle = 'red';
				c.xSpeed = c.ySpeed = 0;
				c.state = this.CIRCLE_STATE.EXPLODING;
				this.gameState = this.GAME_STATE.EXPLODING;
				this.roundScore++;
				break;
			}
		}
	},
	checkForCollisions: function(){
		//TODO
	},
	drawHUD: function(ctx){
		this.fillText('This Round: ' + this.roundScore + ' of ' + this.numCircles, 20,20,'14pt courier','#ddd');
		this.fillText('Total Score: ' + this.totalScore, this.WIDTH - 200, 20, '14pt courier', '#ddd');	
	}
}; // end app.main
