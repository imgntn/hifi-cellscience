(function() {
    //  var baseURL = "http://dynamoidapps.com/HighFidelity/Cosm/";
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
       var  results  = Entities.findEntities(props.position,10000);
        var mpCount = 0;
        results.forEach(function(r) {
            var rProps = Entities.getEntityProperties(r,"name")
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

        Controller.mousePressEvent.disconnect(this.onMousePress);
        // Controller.mouseMoveEvent.disconnect(this.onMouseMove);
        Controller.mouseReleaseEvent.disconnect(this.onMouseRelease);
    }

    function handleMessages(channel, message, sender) {
        print('HANDLING A MESSAGE IN PROTEIN')
        if (sender === MyAvatar.sessionUUID) {
            if(channel==="Hifi-Motor-Protein-Channel"){
                if(message==='delete'){
                    print('SHOULD DELETE PROTEIN')
                    Entities.deleteEntity(self.entityId)
                }
            }
        }

    }

    Messages.sendMessage('Hifi-Motor-Protein-Channel','create')
    Messages.messageReceived.connect(handleMessages);

    // Controller.mousePressEvent.connect(this.onMousePress);
    // Controller.mouseMoveEvent.connect(this.onMouseMove);
    // Controller.mouseReleaseEvent.connect(this.onMouseRelease);

});