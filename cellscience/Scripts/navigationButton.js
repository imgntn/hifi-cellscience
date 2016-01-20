(function () {


	var version = 1;
	var added = false;
	this.frame=0;

	var self = this;


	this.preload = function (entityId) {
		this.entityId = entityId;

		self.getUserData();
		this.buttonImageURL = self.userData.baseURL + "GUI/GUI_" + self.userData.name + ".png?" + version;

		self.addButton();
		  
			   print ("BODY PITCH: " + JSON.stringify(MyAvatar.bodyPitch)
			  + "BODY YAW: " + JSON.stringify(MyAvatar.bodyYaw)
			  + "BODY ROLL: " + JSON.stringify(MyAvatar.bodyRoll));
	}

	this.addButton = function () {
		self.getUserData();
		this.windowDimensions = Controller.getViewportDimensions();
		this.buttonWidth = 150;
		this.buttonHeight = 50;
		this.buttonPadding = 10;

		this.buttonPositionX = (self.userData.offset + 1) * (this.buttonWidth + this.buttonPadding) + (self.windowDimensions.x/2) - (this.buttonWidth * 3 + this.buttonPadding*2.5) ;
		this.buttonPositionY = (self.windowDimensions.y - self.buttonHeight) - 50;
		this.button = Overlays.addOverlay("image", {
			x: self.buttonPositionX,
			y: self.buttonPositionY,
			width: self.buttonWidth,
			height: self.buttonHeight,
			imageURL: self.buttonImageURL,
			visible: true,
			alpha: 1.0
		});

	}



	this.update = function(deltaTime){
		if (self.frame < 10){
			self.frame++;
		}
		else{
//			this.lookAt(this.userData.target);
		}
	}

	this.onClick = function (event) {
		var clickedOverlay = Overlays.getOverlayAtPoint({
			x: event.x,
			y: event.y
		});


		if (clickedOverlay == self.button) {
			print("Clicked navigation button: " + self.userData.name + ", and looking at " + self.userData.target.x + ", "
				  + self.userData.target.y + ", " + self.userData.target.z);
			
			self.lookAtTarget();
		}


	}

	this.lookAtTarget = function() {
		self.getUserData();
		var direction = Vec3.normalize(Vec3.subtract(self.userData.entryPoint, self.userData.target));
		var pitch = Quat.angleAxis(Math.asin(-direction.y) * 180.0 / Math.PI, {x:1, y:0, z:0});
		var yaw = Quat.angleAxis(Math.atan2(direction.x, direction.z) * 180.0 / Math.PI, {x:0, y:1, z:0});
//		var rotation = Quat.multiply(yaw, pitch);
//		
//		print ("AVATAR rotation is " + rotation.x);
		MyAvatar.goToLocation(self.userData.entryPoint, true, yaw);
//		MyAvatar.orientation = rotation;
		//MyAvatar.headPitch = pitch;
		
	

		MyAvatar.headYaw = 0;

	}

	this.getUserData = function () {
		this.properties = Entities.getEntityProperties(this.entityId);
		if (self.properties.userData) {
			this.userData = JSON.parse(this.properties.userData);
		} else {
			this.userData = {};
		}
	}

	this.unload = function () {
		print('NAVIGATION BUTTON UNLOAD!!!',this.entityId)
		Overlays.deleteOverlay(self.button);

		Controller.mousePressEvent.disconnect(this.onClick);
		  Script.update.disconnect(this.update);
	}

	Controller.mousePressEvent.connect(this.onClick);
	  Script.update.connect(this.update);

});
