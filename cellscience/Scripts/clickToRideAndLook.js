(function(){
  //  var baseURL = "http://dynamoidapps.com/HighFidelity/Cosm/";
    var self = this;

    this.positionTolerance = 6;
    this.seatOffset = {x:0, y:10, z:-10};
    this.exitPos = {x:15, y:-20, z:0};

    this.TOUCH_YAW_SCALE = -0.25;
    this.TOUCH_PITCH_SCALE = -12.5;
    this.FIXED_TOUCH_TIMESTEP = 0.016;

    this.MOUSE_YAW_SCALE = -0.25;
    this.MOUSE_PITCH_SCALE = -12.5;
    this.FIXED_MOUSE_TIMESTEP = 0.016;

    this.isMouseDown = false;
    this.touching = false;
    this.lastMouse = {x:0, y:0};
    this.lastTouch = {x:0, y:0};
    this.yaw = {mouse:0, touch:0};
    this.pitch = {mouse:0, touch:0};

    this.preload = function(entityId) {
        //print("preload");
        this.entityId = entityId;
		this.data = JSON.parse(Entities.getEntityProperties(this.entityId).userData);
        this.buttonImageURL = this.data.baseURL + "GUI/GUI_jump_off.png";
        this.addExitButton();
        this.isRiding = false;
       
        if (this.data && this.data.isDynein) {
            this.rotation = 180;
        } else {
            this.rotation = 0;
        }
    }

    this.addExitButton = function() {
        this.windowDimensions = Controller.getViewportDimensions();
        this.buttonWidth = 75;
        this.buttonHeight = 75;
        this.buttonPadding = 10;

        this.buttonPositionX = (self.windowDimensions.x - self.buttonPadding)/2 - self.buttonWidth/2;
        this.buttonPositionY = (self.windowDimensions.y - self.buttonHeight) - (self.buttonHeight + self.buttonPadding);
        this.exitButton = Overlays.addOverlay("image", {
            x: self.buttonPositionX,
            y: self.buttonPositionY,
            width: self.buttonWidth,
            height: self.buttonHeight,
            imageURL: self.buttonImageURL,
            visible: false,
            alpha: 1.0
        });
    }

    this.update = function(deltaTime) {
        self.updateSeat(deltaTime);
        self.updateLook();
    }

    this.updateSeat = function(deltaTime) {
        //update seat position
        if (self.isRiding || self.activeUpdate) {
            self.properties = Entities.getEntityProperties(self.entityId);
            self.seatPosition = Vec3.sum(self.properties.position, self.seatOffset);
        }
        //move to or from seat
        if (self.activeUpdate) {
            self.activeUpdate(deltaTime);
        }
    }

    this.updateLook = function() {
        if (self.yaw.touch != 0 || self.yaw.mouse != 0) {
            var newOrientation = Quat.multiply(MyAvatar.orientation,
                                               Quat.fromPitchYawRollRadians(0, self.yaw.touch + self.yaw.mouse, 0));
            MyAvatar.orientation = newOrientation;

            if (MyAvatar.hasReferential()) {
                var newYaw = MyAvatar.headYaw + 100 * (self.yaw.touch + self.yaw.mouse);
                if (newYaw < -180) { newYaw += 360; }
                if (newYaw > 180) { newYaw -= 360; }

                print("change yaw with referential: " + MyAvatar.headYaw + " --> " + newYaw);
                MyAvatar.headYaw = newYaw;
                print("yaw is now " + MyAvatar.headYaw);
            }
            self.yaw = {mouse:0, touch:0};
        }

        if (self.pitch.touch != 0 || self.pitch.mouse != 0) {
            var newPitch = MyAvatar.headPitch + self.pitch.touch + self.pitch.mouse;
            MyAvatar.headPitch = newPitch;

            self.pitch = {mouse:0, touch:0};
        }
    }

    this.clickReleaseOnEntity = function(entityId, mouseEvent) {
        if (mouseEvent.isLeftButton && !self.isRiding) {
            print("GET ON");
            self.isRiding = true;
            if (!self.entityId) {
                self.entityId = entityId;
            }
            self.activeUpdate = self.moveToSeat;
        }
    }

    this.onMousePress = function(event) {
        var clickedOverlay = Overlays.getOverlayAtPoint({
            x: event.x,
            y: event.y
        });
        if (event.isLeftButton && clickedOverlay === self.exitButton && !self.activeUpdate) {
            print("GET OFF");
            self.initExit();
        }
        else if (event.isRightButton) {
            self.isMouseDown = true;
            self.lastMouse.x = event.x;
            self.lastMouse.y = event.y;
            self.yaw.mouse = 0;
            self.pitch.mouse = 0;
        }
    }

    this.onMouseMove = function(event) {
        if (self.isMouseDown) {
            self.yaw.mouse += ((event.x - self.lastMouse.x) * self.MOUSE_YAW_SCALE * self.FIXED_MOUSE_TIMESTEP);
            self.pitch.mouse += ((event.y - self.lastMouse.y) * self.MOUSE_PITCH_SCALE * self.FIXED_MOUSE_TIMESTEP);
            self.lastMouse.x = event.x;
            self.lastMouse.y = event.y;
        }
    }

    this.onMouseRelease = function(event) {
        self.isMouseDown = false;
    }

    this.onTouchBegin = function(event) {
        self.touching = true;
        self.lastTouch.x = event.x;
        self.lastTouch.y = event.y;
        self.yaw.touch = 0;
        self.pitch.touch = 0;
    }

    this.onTouchMove = function(event) {
        if (!self.touching) { // handle Qt 5.4.x bug where we get touch update without a touch begin event
            self.touching = true;
            self.lastTouch.x = event.x;
            self.lastTouch.y = event.y;
            self.yaw.touch = 0;
            self.pitch.touch = 0;
        }

        self.yaw.touch += ((event.x - self.lastTouch.x) * self.TOUCH_YAW_SCALE * self.FIXED_TOUCH_TIMESTEP);
        self.pitch.touch += ((event.y - self.lastTouch.y) * self.TOUCH_PITCH_SCALE * self.FIXED_TOUCH_TIMESTEP);
        self.lastTouch.x = event.x;
        self.lastTouch.y = event.y;
    }

    this.onTouchEnd = function(event) {
        self.touching = false;
    }

    this.moveToSeat = function(deltaTime) {
        self.distance = Vec3.distance(MyAvatar.position, self.seatPosition);
        if (self.distance > self.positionTolerance) {
            self.sanitizedRotation = Quat.fromPitchYawRollDegrees(0, Quat.safeEulerAngles(self.properties.rotation).y + self.rotation, 0);
            MyAvatar.orientation = Quat.mix(MyAvatar.orientation, self.sanitizedRotation, 0.02);
            MyAvatar.position = Vec3.mix(MyAvatar.position, self.seatPosition, 0.05);
        } else {
            print("set referential");
            self.activeUpdate = null;
            Overlays.editOverlay(self.exitButton, {
                visible: true
            });
            MyAvatar.setModelReferential(self.properties.id);
        }
    }

    this.initExit = function() {
        self.reset();
        this.goalPos = Vec3.sum(self.seatPosition, self.exitPos);
        this.activeUpdate = this.exitSeat;
        this.headYawOnExit = MyAvatar.headYaw;
        this.exitT = 0;
    }

    this.exitSeat = function(deltaTime) {
        self.distance = Vec3.distance(MyAvatar.position, this.goalPos);
        if (self.distance > self.positionTolerance) {
//            self.sanitizedRotation = Quat.fromPitchYawRollDegrees(0, Quat.safeEulerAngles(self.properties.rotation).y, 0);
//            MyAvatar.orientation = Quat.mix(MyAvatar.orientation, self.sanitizedRotation, 0.02);
            MyAvatar.headYaw = self.mix(self.headYawOnExit, 0, self.exitT);
            self.exitT += 0.05;
            if (self.exitT >= 1) { self.exitT = 1; }
            MyAvatar.position = Vec3.mix(MyAvatar.position, this.goalPos, 0.05);
        } else {
            print("got off");
            self.isRiding = false;
            self.activeUpdate = null;
            MyAvatar.headYaw = 0;
        }
        print("head yaw = " + MyAvatar.headYaw);
    }

    this.reset = function() {
        if (self.isRiding) {
            print("clear referential");
            MyAvatar.clearReferential();
            Overlays.editOverlay(this.exitButton, {
                visible: false
            });
        }
    }

    this.mix = function(start, end, amt) {
        return start + amt * (end - start);
    }

    this.unload = function() {
//        if (!self.unloaded) {
            print("unload");
            this.unloaded = true;
            self.reset();

            Controller.mousePressEvent.disconnect(this.onMousePress);
            Controller.mouseMoveEvent.disconnect(this.onMouseMove);
            Controller.mouseReleaseEvent.disconnect(this.onMouseRelease);

            Controller.touchBeginEvent.disconnect(this.onTouchBegin);
            Controller.touchUpdateEvent.disconnect(this.onTouchMove);
            Controller.touchEndEvent.disconnect(this.onTouchEnd);

            Controller.releaseTouchEvents(); // re-enable the standard application for mouse events

            Script.update.disconnect(this.update);
//        }
    }

    Controller.mousePressEvent.connect(this.onMousePress);
    Controller.mouseMoveEvent.connect(this.onMouseMove);
    Controller.mouseReleaseEvent.connect(this.onMouseRelease);

    Controller.touchBeginEvent.connect(this.onTouchBegin);
    Controller.touchUpdateEvent.connect(this.onTouchMove);
    Controller.touchEndEvent.connect(this.onTouchEnd);

    Controller.captureTouchEvents(); // disable the standard application for mouse events

    Script.update.connect(this.update);

});
