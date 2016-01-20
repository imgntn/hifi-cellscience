(function() {
    var self = this;

    var version = 7;
    this.preload = function(entityId) {
        self.soundPlaying = false;
        self.entityId = entityId;
        self.getUserData();
        self.soundURL = self.userData.baseURL + "Audio/" + self.userData.name + ".wav?" + version;
		print("WAV name location is " + self.userData.baseURL + "Audio/" + self.userData.name + ".wav");
		
        self.soundOptions = {
            stereo: true,
            loop: true,
            localOnly: true,
            volume: 0.4
        };
        this.sound = SoundCache.getSound(self.soundURL);



    }


    this.getUserData = function() {
        self.properties = Entities.getEntityProperties(self.entityId);
        if (self.properties.userData) {
            self.userData = JSON.parse(this.properties.userData);
        } else {
            self.userData = {};
        }
    }

    //      Script.update.connect(this.update);


    this.enterEntity = function(entityID) {
        print("entering audio zone");
        if (self.sound.downloaded) {
            print("playing background audio named " + self.userData.name + "which has been downloaded");
            this.soundPlaying = Audio.playSound(self.sound, self.soundOptions);

        } else {
            print("sound is not downloaded");
        }
    }



    this.leaveEntity = function(entityID) {
        print("leaving audio area " + self.userData.name);
        if (self.soundPlaying != null) {
            print("not null");
            print("Stopped sound " + self.userData.name);
            self.soundPlaying.stop();
        } else {
            print("Sound not playing");
        }
    }



});