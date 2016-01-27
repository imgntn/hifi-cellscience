(function() {

    var TARGET_OFFSET = {
        x: -1,
        y: 1,
        z: -1
    }

    var baseURL = "https://hifi-content.s3.amazonaws.com/DomainContent/CellScience/";

    var self = this;
    
    this.preload = function(entityId) {

        this.entityId = entityId;
        this.data = JSON.parse(Entities.getEntityProperties(this.entityId, "userData").userData);
        this.buttonImageURL = baseURL + "GUI/GUI_jump_off.png";
        this.addExitButton();
        this.isRiding = false;

        if (this.data && this.data.isDynein) {
            this.rotation = 180;
        } else {
            this.rotation = 0;
        }
        var props = Entities.getEntityProperties(entityId);
        var results = Entities.findEntities(props.position, 10000);
        var mpCount = 0;

        results.forEach(function(r) {
            var rProps = Entities.getEntityProperties(r, "name")
            if (rProps.name.indexOf('Hifi-Motor-Protein-Anchor') > -1) {
                mpCount++
            }
            print('mp count')
            if (mpCount > 4) {
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

    this.clickReleaseOnEntity = function(entityId, mouseEvent) {
        print('CLICKED ON MOTOR PROTEIN')
        if (mouseEvent.isLeftButton && !self.isRiding) {
            print("GET ON");
            self.isRiding = true;
            if (!self.entityId) {
                self.entityId = entityId;
            }
            self.entityLocation = Entities.getEntityProperties(this.entityId, "position").position;
            self.targetLocation = Vec3.sum(self.entityLocation, TARGET_OFFSET);
            Overlays.editOverlay(self.exitButton, {
                visible: true
            });
            Controller.mousePressEvent.connect(this.onMousePress);
            Script.update.connect(this.update);
        }
    }

    this.lastAvatarPosition = null;
    this.lastEntityPosition = null;
    this.update = function(deltaTime) {
        if (self.isRiding !== true) {
            return
        }

        Entities.editEntity(self.entityId, {
            velocity: {
                x: 1,
                y: 0,
                z: 0
            }
        })
        self.lastEntityLocation = self.entityLocation;
        self.lastTargetLocation = self.targetLocation
        self.entityLocation = Entities.getEntityProperties(self.entityId, "position").position;
        self.targetLocation = Vec3.sum(self.entityLocation, TARGET_OFFSET);
        //  print('JBP self.lastTargetLocation' + JSON.stringify(self.lastTargetLocation))
        //  print('JBP self.targetLocation' + JSON.stringify(self.targetLocation))
        var diff = Vec3.distance(self.targetLocation, self.lastTargetLocation);
        print('JBP diff is::' + diff)
        self.addThrustToAvatar(deltaTime);
    }


    this.addThrustToAvatar = function(deltaTime) {
        var targetCurrentLocationToLastLocation = Vec3.subtract(self.targetLocation, self.lastTargetLocation);

        // print('JBP targetCurrentLocationToLastLocation' + JSON.stringify(targetCurrentLocationToLastLocation));
        // print('JBP deltaTime' + deltaTime)
        // print('JBP velocity' + JSON.stringify(self.velocity))
        var thrustToAdd = Vec3.multiply(100, targetCurrentLocationToLastLocation);
        thrustToAdd = Vec3.multiply(thrustToAdd, 1 / deltaTime);
        print('JBP adding thrust!' + JSON.stringify(thrustToAdd))

        MyAvatar.addThrust(thrustToAdd);

    }

    this.onMousePress = function(event) {
        var clickedOverlay = Overlays.getOverlayAtPoint({
            x: event.x,
            y: event.y
        });
        if (event.isLeftButton && clickedOverlay === self.exitButton) {
            print("GET OFF");
            Script.update.disconnect(this.update);
            self.reset();
        }
    }

    this.reset = function() {
        print('reset')
        if (self.isRiding) {
            Overlays.editOverlay(this.exitButton, {
                visible: false
            });
        }
        self.isRiding = false;
    }

    this.unload = function() {
        print("unload");
        self.reset();

        Controller.mousePressEvent.disconnect(this.onMousePress);
    }

    function handleMessages(channel, message, sender) {
        print('HANDLING A MESSAGE IN PROTEIN')
        if (sender === MyAvatar.sessionUUID) {
            if (channel === "Hifi-Motor-Protein-Channel") {
                if (message === 'delete') {
                    print('SHOULD DELETE PROTEIN')
                    Entities.deleteEntity(self.entityId)
                }
            }
        }

    }

    Messages.messageReceived.connect(handleMessages);



});