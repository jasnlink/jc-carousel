(() => {

    document.addEventListener('DOMContentLoaded', function() {

        let container = document.querySelector('.dup-carousel')
        let innerContainer = document.querySelector('.dup-carousel-inner');
        let slideArray = document.querySelectorAll('.dup-carousel-item');
        let slideOnScreen = 5;
        let slideTransitionTime = 0.4;
        let slideIsAnimated = false;
        let pos = 0;
        let currentScrollAmount = 0;

        let dragging = false;
        let dragAmountToNextSlide = 100;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        let teleportOffset = 0;

        //handles the start of dragging, when the user has just put down their finger or mouse to start dragging on the slides
        function dragStart(e) {
            //differentiate between a mouse or touch, the X and Y coords are accessed differently
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX;
                initialY = e.touches[0].clientY;
            } else {
                initialX = e.clientX;
                initialY = e.clientY;
            }

            dragging = true;
        }

        //handles while dragging, when the user's finger or mouse is still dragging over the slides
        function drag(e) {
            e.preventDefault();
            if(dragging) {
                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX;
                    currentY = e.touches[0].clientY;
                } else {
                    currentX = e.clientX;
                    currentY = e.clientY;
                }

                xOffset = currentX - initialX;
                yOffset = currentY - initialY;

                doTranslate(innerContainer, (xOffset*.2), 'px');

            }

        }

        //handles the end of dragging, where the user lifts up his finger or the mouse at the end of dragging the cursor over the slides
        async function dragEnd(e) {

            //this handles 'the catch' when the user is done dragging and now we have to move all the slides to exactly where the mouse is
            //this prevents 'elastic bouncing' effect where the slides jump back to the beginning of a slide and then moves to the next slide
            async function dragOffset() {
                return new Promise((resolve, reject) => {
                    for(let i = 0; i < slideArray.length; i++) {
                        doTranslate(slideArray[i], currentScrollAmount, '%', (xOffset*.2), 'px');
                        if(i === slideArray.length-1) {
                            dragCleanup(false)
                            setTimeout(function(){resolve()},(24),resolve)
                        }
                    }
                    
                })
            }

            //cleans up all X and Y coords tracking variables and resets the carousel X translation
            async function dragCleanup(animate) {


                //reset all X and Y coords tracking
                teleportOffset = (xOffset*.2)

                initialX = undefined;
                initialY = undefined;

                xOffset = undefined;
                yOffset = undefined;

                currentX = undefined;
                currentY = undefined;

                dragging = false;

                //translate carousel back to original X coord, with or without animation (depends on if the user dragged through the drag threshold)
                if(animate === true) {

                    addSlideAnimation(innerContainer)
                    innerContainer.addEventListener('transitionend', () => {
                        removeSlideAnimation(innerContainer)
                    }, {once:true})

                }
                doTranslate(innerContainer, 0, 'px', 0, 'px')

            }

            //checks to see if the user dragged through the drag threshold
            if(dragging) {
                if(xOffset < -(dragAmountToNextSlide)) {
                    removeSlideAnimation(slideArray)
                    .then(() => {
                        dragOffset()
                        .then(() => {

                            addSlideAnimation(slideArray)
                            .then(()=>{
                                goNext()
                            })

                        })
                        
                    })

                }
                else if(xOffset > dragAmountToNextSlide) {
                    removeSlideAnimation(slideArray)
                    .then(() => {
                        dragOffset()
                        .then(() => {

                            addSlideAnimation(slideArray)
                            .then(()=>{
                                goPrev()
                            })

                        })
                        
                    })
                } else {
                    dragCleanup(true);
                }

            }

        }

        //low level function, adds slide animation calss from a target element
        async function addSlideAnimation(target) {

            return new Promise((resolve, reject) => {

                if(target.length) {
                    for(let i = 0; i < target.length; i++) {
                        target[i].classList.add('dup-slide');

                        if(i === target.length-1) {
                            slideIsAnimated = true
                            resolve()
                        }

                    }
                } else {
                    slideIsAnimated = true
                    target.classList.add('dup-slide');
                    resolve();
                }

            })

        }

        //low level function, removes slide animation class from a target element
        async function removeSlideAnimation(target) {

            return new Promise((resolve, reject) => {

                if(target.length) {
                    for(let i = 0; i < target.length; i++) {
                        target[i].classList.remove('dup-slide');

                        if(i === target.length-1) {
                            slideIsAnimated = false
                            setTimeout(function(){resolve()},1,resolve)
                        }

                    }
                } else {
                    slideIsAnimated = false
                    target.classList.remove('dup-slide');
                    setTimeout(function(){resolve()},1,resolve)
                }

            })
            
        }

        //mid level function, instantly teleports to the designed slide without animation
        async function teleport(direction) {

            return new Promise((resolve, reject) => {

                removeSlideAnimation(slideArray)
                .then(() => {

                    if(direction === 'prev') {
                        pos=(slideArray.length-1)-(slideOnScreen-1)
                    }
                    if(direction === 'next') {
                        pos=0
                    }
                    slide(null, 1, teleportOffset)
                    .then(() => {
                        teleportOffset = 0
                        addSlideAnimation(slideArray)
                        .then(resolve())
                    })

                })

            })

        }

        //handler function, logic for teleport or simple slide
        async function goPrev() {

            return new Promise((resolve, reject) => {

                if(pos === 1) {
                    teleport('prev')
                    .then(() => {
                        slide('prev')
                        .then(resolve())
                    })
                } else {    
                    slide('prev').then(resolve())
                }

            })

        }

        //handler function, logic for teleport or simple slide
        async function goNext() {

            return new Promise((resolve, reject) => {

                if(pos === (slideArray.length)-(slideOnScreen-1)-2) {
                    teleport('next')
                    .then(() => {
                        slide('next')
                        .then(resolve())
                    })
                } else {
                    slide('next').then(()=>{console.log('slideresolve');resolve()})
                }

            })

        }

        //mid level function, takes care of sliding
        async function slide(direction, amount=1, offset=0) {

            return new Promise((resolve, reject) => {

                if(direction === 'prev') {
                    pos-=amount;
                }
                else if(direction === 'next') {
                    pos+=amount;
                }
                currentScrollAmount = -(pos)*(amount*100);

                for(let i = 0; i < slideArray.length; i++) {
                    doTranslate(slideArray[i], currentScrollAmount, '%', offset, 'px')

                    if(i === slideArray.length-1) {
                        if(slideIsAnimated === true) {
                            setTimeout(function(){resolve()},(slideTransitionTime*1000),resolve)
                        } else {
                            setTimeout(function(){resolve()},18,resolve)
                        }
                    }
                }

            })

        }

        //lowest level function that does the slide movement
        async function doTranslate(element, amount, amountUnit, offset=0, offsetUnit='px') {
            element.style = 'transform:translateX(calc('+amount+amountUnit+' + '+offset+offsetUnit+'))'
        }

        //inserts all css styling need for the carousel to work.
        //this method also allows css properties to be changed on the fly by javascript variables.
        function buildStyles() {

            document.head.insertAdjacentHTML("beforeend", `
                    <style>
                        body{margin:0;overflowX:hidden;}
                        
                        .dup-carousel-item {
                            width:calc(100% / `+slideOnScreen+`) !important;
                        }
                        .dup-slide {
                            -webkit-transition: transform `+slideTransitionTime+`s ease-in-out !important;
                            -moz-transition: transform `+slideTransitionTime+`s ease-in-out !important;
                            -o-transition: transform `+slideTransitionTime+`s ease-in-out !important;
                            transition:transform `+slideTransitionTime+`s ease-in-out !important;
                        }

                        .dup-carousel {
                            min-width:100vw;
                            white-space:nowrap;
                            overflow:hidden;
                        }

                        .dup-carousel-item {
                            margin-right:-4px;
                            display:inline-block;
                            background-color:red;
                            height:200px;
                            border:8px black solid;
                            transition: none;
                        }
                    </style>
                `)
        }

        //builds inner container listeners for the use
        async function buildInnerContainerListeners() {
            innerContainer.addEventListener("touchstart", dragStart, true);
            innerContainer.addEventListener("touchmove", drag, true);
            innerContainer.addEventListener("touchend", dragEnd, true);

            innerContainer.addEventListener("mousedown", dragStart, true);
            innerContainer.addEventListener("mousemove", drag, true);
            innerContainer.addEventListener("mouseup", dragEnd, true);
            innerContainer.addEventListener("mouseleave", dragEnd);
        }

        async function buildControlListeners() {

            document.querySelectorAll('.ctrl-btn').forEach(el => {

                if(el.id === 'prev') {
                    el.addEventListener('click', goPrev)
                }
                if(el.id === 'next') {
                    el.addEventListener('click', goNext)
                }
                if(el.id === 'pos') {
                    el.addEventListener('click', () => {
                        console.log(pos)
                    })
                }
            })
        }

        //constructor function that handles the initial cloning of slides
        async function buildSlides() {

            let cloned = slideArray[slideArray.length-1].cloneNode(true);
            innerContainer.prepend(cloned)

            for(let i = 0; i < slideOnScreen; i++) {
                cloned = slideArray[i].cloneNode(true)
                innerContainer.appendChild(cloned)
            }
            slideArray = document.getElementsByClassName('dup-carousel-item');
            pos=1
            await slide();
            setTimeout(addSlideAnimation, 1, slideArray)
            return
        }

        buildStyles();
        buildInnerContainerListeners();
        buildSlides();
        buildControlListeners();

    })

})();