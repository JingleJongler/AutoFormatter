new Vue({ //WARNING I like to refer to myself in comments as numerous pronouns as it seperates me from the code 
    el: '#app',
    vuetify: new Vuetify(),

    data: {
        robot: { x: 50, y: 70, width: 49, height: 49 },
        leg: { x: 50, y: 100, width: 20, height: 30 },
        goal: 'Repair LEG',
        steps: 0,
        command: '', //Storage for the user command input
        inventory: [], //Storage for the collected Items in later versions maybe have the robot upgrade itself or fix
        items: [], // WHAT ITEMS ARE ON THE CONVEYOR, aka cardboard box, junk 

        legImg: null, //This is the image storage for the leg
        robotImg: null,
        robotLeft: null,
        robotRight: null,
        isRightFrame: true,
        //TERMINAL LOG MESSAGES ARE VITAL DO NOT DELETE
        terminalLog: [],
        canvas: null,
        ctx: null,
        scale: 1
    },
    mounted() { //RUN AFTER VUE COMP IS IN DOMMY BOI
        //setup Canvas
        this.canvas = document.getElementById('responsiveGameCanvas');
        this.ctx = this.canvas.getContext('2d');
        //Set initial width and height it helps act as a counterBalancer By Setting them here it meanst hat the canvas elements has 2 sizes, the CSS and the canvas Resolution ,
        //Which allows it to proportional Rescale the Canvas and Items inside
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        //Image setup with sprites 
        this.legImg = new Image();
        this.legImg.src = 'wheel.png'; ///Temp placement of mettatons foot dont ask why its called a wheel
        //MTT temp
        this.robotImg = new Image();
        this.robotImg.src = 'robot.png';
        this.robotImg2 = new Image();
        this.robotImg2.src = 'robot2.png'; // sprite to show on touch
        //walk left
        this.robotLeft = new Image();
        this.robotLeft.src = 'robotleftup.png'; // sprite to show on touch
        //leg walk right
        this.robotRight = new Image();
        this.robotRight.src = 'robotrightup.png'; // sprite to show on touch

        //Swap frames every 0.5
        this.robotImg = this.robotRight;
        setInterval(() => {
            this.isRightFrame = !this.isRightFrame; //Flip-Flop Toggle flag(every 0.25 it switch from true to false)
            this.robotImg = this.isRightFrame ? this.robotRight : this.robotLeft; //  Act as ternary operator aka if else 
            //if isRightFrame=T use robot right else use robot left
        }, 250);

        this.startTheGameLoop(); //start the looped
    },

    methods: {
        reScale() {
            const container = document.getElementById('canvasContainer');
            this.canvas.width = container.offsetWidth;
            this.canvas.height = container.offsetHeight;

            this.scale = Math.min(container.offsetWidth / 400, container.offsetHeight / 200);
            //Robot Rescale

            this.robot.width = this.canvas.width * 0.1;
            this.robot.height = this.canvas.height * 0.1;
            this.robot.x = this.canvas.width * 0.1;
            this.robot.y = this.canvas.height * 0.5 - this.robot.height;

            // Rescale all items
            this.items.forEach(item => {
                if (item.type === "wheel") {
                    item.width = this.canvas.width * 0.05;
                    item.height = this.canvas.height * 0.05;

                } else {
                    // Other items
                    item.width = this.canvas.width * 0.1;
                    item.height = this.canvas.height * 0.3;
                    //  item.y = this.canvas.height * 0.35;
                }
            });
            window.addEventListener('resize', () => {
                this.reScale();
            });

            // Draw everything after scaling
            this.draw();
        },

        isTouching(item) { //Simple boundry box collsion method experimnet
            return (
                this.robot.x < item.x + 30 && // 30 = item width
                this.robot.x + this.robot.width > item.x &&
                this.robot.y < item.y + 30 && // 30 = item height
                this.robot.y + this.robot.height > item.y
            );
        },
        startTheGameLoop() { //split into two lines in case you want to do some furutre testing, also is easier to see where the assholes are

            //  const canvas = document.getElementById('responsiveGameCanvas'); //Link to game canvas environment
            //  const ctx = canvas.getContext('2d');
            //intervals set for speed and fps set up the game environment
            setInterval(() => {
                this.update(); //GAME STATE UPDATER
                this.draw(); //draw scene to canvas
            }, 1000 / 30); //sets the FPS to be 30 frames per second

        },
        update() {
            this.items.forEach(item => item.x -= 3); //this is the speed
            //move the items left along the temp conveyor belt placement//-2 is for a temp area
            //IF ITEM IS OFF SCREEN REMOVE IT FROM THE ARRAY----STOP OVERLOAD
            //   this.items = this.items.filter(item => item.x > -20);
            //random item spawn(temp use whee;) add around a 2percent chance per frame so if 30fps per second the chance is whaqt
            const legImg = new Image();
            legImg.src = 'wheel.png'; ///Temp placement of mettatons foot dont ask why its called a wheel
            if (Math.random() < .02) {
                this.items.push({
                    //Dynamic resizing
                    x: this.canvas.width,
                    y: this.canvas.height * 0.5,
                    type: "wheel",
                    width: this.canvas.width * 2,
                    height: this.canvas.height * 1,
                    img: legImg
                });

            }

            this.items = this.items.filter(item => item.x > -20);
            //Touch detection event, 
            //Next add a health bARA
            //And then add it so everty time it hits a obejct it takes from the health
            //If this  gets to 0 end game
            this.items.forEach(item => {
                if (this.isTouching(item)) {
                    // IF NOT CHANGED THEN RUN
                    if (!this.robotTouched) {
                        this.robotTouched = true; // flag to prevent multiple triggers MAKE SURE YOU KEEP THE FLAG EVENT
                        const originalImg = this.robotImg;
                        this.robotImg = this.robotImg2; // swap sprite to Hurt Sprite
                        this.terminalLog.push('Robot touched an item');
                        // Revert after 1 second
                        setTimeout(() => {
                            this.robotImg = originalImg;
                            this.robotTouched = false; // reset flag
                        }, 1000);
                    }
                }
            });

            //CHECK  if collision  state is triggered

        },
        //https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
        //The above is a reference for creating images in Html but also using Java
        draw() {
            //   const canvas = document.getElementById('responsiveGameCanvas'); //Redefine because why not
            //Also it will maek it easier when we add height addjsutiable UI adaptiation/ laptop desktop movile
            //IDEA IS THAT THIS IS THE METHOD THAT DRAWS ALL THE GAME ELEMENTS IN THE CANVAS BOX
            //AUTO START BY CLEARING CANVAS
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            //Conveyer Belt---For now it is drawn via code, maybe later add game background sprites

            this.ctx.fillStyle = "gray";
            //   this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); //Set up for the square drw          
            // this.ctx.fillRect(0, 150, 400, 30); //Set up for the square drw          
            //Top line for conveyer belt is a temp holder 


            //   this.ctx.fillRect(0, 150, 140, 30);
            //Despite the overflow this is the easiest way for dynamic sizing  

            this.ctx.fillStyle = "black";
            //Top Boundary for Conveyer Belt
            this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, 3);


            //Bottom Boundary for conveyer Belt
            this.ctx.fillRect(0, this.canvas.height * 0.54, this.canvas.width, 3);
            this.ctx.fillRect(0, this.canvas.height * 0.83, this.canvas.width, 2);
            //Bottom Line for the belt for visual spacing


            //   this.ctx.fillRect(0, this.canvas.height * 0.76, this.canvas.width, this.canvas.height * 0.03);

            //Bottom Line line for space outer



            //draw robot
            if (this.robotImg.complete) {
                this.ctx.drawImage(this.robotImg, this.robot.x, this.robot.y, this.robot.width, this.robot.height);
            }

            //Robot temp mate
            // ctx.fillStyle - "red";
            //THIS IS THE RANDOM OBJECT STUFF it is a test mech
            //This prints red squares this.items.forEach(item => ctx.fillRect(item.x, item.y, 20, 20));
            this.items.forEach(item => {
                if (item.img && item.img.complete) {
                    if (item.type === "wheel") {
                        this.ctx.drawImage(item.img, item.x, item.y, this.leg.width, this.leg.height);
                    }
                    //    this.ctx.drawImage(item.img, item.x, item.y, this.robot.width, this.robot.height); //the size and location


                } else { //if Robot does not load use red square placeholder
                    this.ctx.fillStyle = "red";
                    this.ctx.fillRect(0, 180, 400, 2);
                }
            });
        },
        //exists for test



        handleCommand() {

            const cmd = this.command.toLowerCase().trim();
            const originY = 70;
            const originX = 50; //Later use might be helpful
            this.steps++;

            if (cmd) {
                this.terminalLog.push(`> ${cmd}`);
                //Move left across screen
                if (cmd === 'move left') {
                    this.robot.x += 10;
                    this.robot.y -= 10;
                    //Temp Timeout measure for making sure condition is set
                    setTimeout(() => {
                        this.robot.y = originY;
                    }, 2000);
                }
                //Move right across screen
                if (cmd === 'move right') {
                    this.robot.x += 10;
                    this.robot.y += 10;
                    setTimeout(() => {
                        this.robot.y = originY;
                    }, 2000);
                }
                //BASIC SETUP INVOLVES,
                if (cmd === 'pickup') {
                    //Condition to check for if the item is close enough to the actual robot
                    const isItemNearby = this.items.findIndex(item => { //alt use some if use lets case, else  use const and findIndex
                        let dx = Math.abs(item.x - this.robot.x); //REMEMBER DX stands for delta x its to do with different in the x coord between two objects you found this out unwillingly
                        let dy = Math.abs(item.y - this.robot.y);
                        return dx < 100 && dy < 100; //prox threshold I still have no idea how i/you/me/myself/and/i figured this out 
                        //apparently use this to ensure its near the robot
                    });


                    if (isItemNearby !== -1) {
                        //IF then move item from the ITEMS array into the inventory
                        const picked = this.items.splice(isItemNearby, 1)[0];
                        this.inventory.push(picked);
                        //Issue you had,
                        //item.type will return nothing BECAUSE!!! Item is  A OBJECT NOT A STRING, 
                        //When we moved the ITEM(nearby object  by taking it and Removing it from the environment and ADDING IT AS A STRING TO inventory)
                        this.terminalLog.push("Picked Up " + picked.type);
                        //If you need to confirm existance  this.terminalLog.push("IS NEAR");         } else { this.terminalLog.push("No"); }
                    } else {
                        this.terminalLog.push("No item nearby.");
                    }
                }
                //CHECK INVENTORY
                else if (cmd === "inventory status") {
                    this.terminalLog.push(this.inventory.map(item => item.type).join(","));

                }


                //jump
                //This example was really helpful in getting it to return to the "Origin State"
                //https://stackoverflow.com/questions/64071008/settimeout-on-if-else-statement
                else if (cmd === 'jump') { //or if click space
                    //default y backing
                    this.robot.y += -20;
                    setTimeout(() => {
                        this.robot.y = originY;
                    }, 2000);
                } else if (cmd === "") {
                    this.command = "";
                } else { //If you keep this at the end    "this.command = ''; "  IT WILL ALWAYS TRIGGER
                    this.terminalLog.push('Unknown command.');
                }
            }
            this.command = "";



        }
    }
});