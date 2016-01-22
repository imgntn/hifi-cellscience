(function() {
    var MAX_MOTOR_PROTEINS = 4;
    var self = this;

    this.preload = function(entityId) {
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

        var props = Entities.getEntityProperties(entityId);
        var results = Entities.findEntities(props.position, 5000);
        var motorProteinCount = 0;
        results.forEach(function(result) {
            var resultProps = Entities.getEntityProperties(result, "name")
            if (resultProps.name.indexOf('Hifi-Motor-Protein-Anchor') > -1) {
                motorProteinCount++
            }
            if (motorProteinCount > MAX_MOTOR_PROTEINS) {
                Entities.deleteEntity(entityId);
                return;
            }
        })

    }

    this.addExitButton = function() {
        this.windowDimensions = Controller.getViewportDimensions();
        this.buttonWidth = 75;
        this.buttonHeight = 75;
        this.buttonPadding = 10;

        this.buttonPositionX = (self.windowDimensions.x - self.buttonPadding) / 2 - self.buttonWidth / 2;
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

    this.parentThisEntityToAvatar = function() {
        MyAvatar.setParentID(this.entityId);
    }

    this.unparentThisEntityFromAvatar = function() {
        MyAvatar.setParentID('');
    }

    this.clickReleaseOnEntity = function(entityId, mouseEvent) {
        if (mouseEvent.isLeftButton && !self.isRiding) {
            print("GET ON");
            self.isRiding = true;
            if (!self.entityId) {
                self.entityId = entityId;
            }
            self.parentThisEntityToAvatar();
            Overlays.editOverlay(self.exitButton, {
                visible: true
            });
        }
    }

    this.onMousePress = function(event) {
        var clickedOverlay = Overlays.getOverlayAtPoint({
            x: event.x,
            y: event.y
        });
        if (event.isLeftButton && clickedOverlay === self.exitButton) {
            print("GET OFF");
            self.reset();
        }
    }

    this.reset = function() {
        print('reset')
        if (self.isRiding) {
            self.unparentThisEntityFromAvatar();
            Overlays.editOverlay(this.exitButton, {
                visible: false
            });
        }
        self.isRiding = false;
    }

    this.unload = function() {
        print("unload");
        self.reset();
        Overlays.deleteOverlay(self.exitButton)
        Controller.mousePressEvent.disconnect(self.onMousePress);
        Controller.mouseReleaseEvent.disconnect(self.onMouseRelease);
    }


    Controller.mousePressEvent.connect(self.onMousePress);
    Controller.mousePressEvent.connect(self.onMouseRelease);

});