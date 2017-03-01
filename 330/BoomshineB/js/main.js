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

		NUM_CIRCLES_START: 5,
		START_RADIUS: 8,
		MAX_SPEED: 80,
		CIRCLE_STATE: {
			NORMAL: 0,
			EXPLODING: 1,
			MAX_SIZE: 2,
			IMPLODING: 3,
			DONE: 4
		},
		circles: [],
		numCircles: this.NUM_CIRCLES_START,

    // methods
	init : function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		
		this.numCircles = this.NUM_CIRCLES_START;
		this.circles = this.makeCircles(this.numCircles);
		
		// start the game loop
		this.update();
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
		this.drawCircles(this.ctx);	
	
		// iii) draw HUD
		
		
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
			c.x = getRandom(this.START_RADIUS * 2, this.WIDTH - this.START_RADIUS * 2);
			c.y = getRandom(this.START_RADIUS * 2, this.HEIGHT - this.START_RADIUS * 2);

			//add a radius property
			c.radius = this.START_RADIUS;

			var randomVector = getRandomUnitVector();
			c.xSpeed = randomVector.x;
			c.ySpeed = randomVector.y;

			//make more properties
			c.speed = this.MAX_SPEED;
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
		for(var i = 0; i< this.circles.length; i++){
			var c = this.circles[i];
			c.draw(ctx);
		}
	},
	moveCircles: function(dt){
		for(var i = 0; i < this.circles.length; i++){
			var c = this.circles[i];
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
	}
}; // end app.main
