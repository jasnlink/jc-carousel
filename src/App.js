(() => {
    /**
     * Execute the following code when the DOM is fully loaded.
     */
    document.addEventListener('DOMContentLoaded', function() {

        let container = document.querySelector('.dup-carousel')
        let innerContainer = document.querySelector('.dup-carousel-inner');
        let slideArray = document.querySelectorAll('.dup-carousel-item');
        let slideOnScreen = 4;
        let slideTransitionTime = 0.4;
        let pos = 0;
        let scrollAmount = 0;

        let dragging = false;
        let dragAmountToNextSlide = 100;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;


        function dragStart(e) {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX;
                initialY = e.touches[0].clientY;
            } else {
                initialX = e.clientX;
                initialY = e.clientY;
            }

            dragging = true;
        }

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

                doTranslate(innerContainer, xOffset*.3, 'px');

            }

        }

        async function dragOffset() {
            for(let slide of slideArray) {
                doTranslate(slide, scrollAmount, '%', xOffset, 'px');
            }
            return
        }

        async function dragEnd(e) {

            if(dragging) {
                if(xOffset < -(dragAmountToNextSlide)) {
                    doTranslate(innerContainer, 0, 'px')
                    await removeSlideAnimation(slideArray);
                    await dragOffset();
                    await addSlideAnimation(slideArray);
                    await slideX('next')

                }
                else if(xOffset > dragAmountToNextSlide) {
                    doTranslate(innerContainer, 0, 'px')
                    await removeSlideAnimation(slideArray);
                    await dragOffset();
                    await addSlideAnimation(slideArray);
                    await slideX('prev')
                }

                initialX = undefined;
                initialY = undefined;

                xOffset = undefined;
                yOffset = undefined;

                currentX = undefined;
                currentY = undefined;

                dragging = false;

                innerContainer.classList.add('dup-slide');
                innerContainer.addEventListener('transitionend', () => {
                    innerContainer.classList.remove('dup-slide')
                }, {once:true})
                //await doTranslate(innerContainer, 0, 'px')
                await doTranslate(innerContainer, 0, 'px', 0, 'px')

                console.log('done drag')
            }

        }

        async function buildSlides() {

            let cloned = slideArray[slideArray.length-1].cloneNode(true);
            innerContainer.prepend(cloned)

            for(let i = 0; i <= slideOnScreen; i++) {
                cloned = slideArray[i].cloneNode(true)
                innerContainer.appendChild(cloned)
            }
            slideArray = document.querySelectorAll('.dup-carousel-item');
            console.log('slideOnScreen-1',slideOnScreen-1)
            pos=1
            await slideX();
            setTimeout(addSlideAnimation, 1, slideArray)
            return
        }


        async function slideX(direction, amount=1, callback) {
            if(direction === 'prev') {
                if(pos === 1 && amount === 1) {
                    await teleport('prev', setTimeout(slideX, 2, 'prev'))
                } else {
                    pos-=amount;
                }
            }
            else if(direction === 'next') {
                if(pos === slideArray.length-(slideOnScreen-1)-2) {
                    await teleport('next', setTimeout(slideX, 2, 'next'))
                } else {
                    pos+=amount;
                }
            }
            scrollAmount = -(pos)*(amount*100);
            console.log('amount',amount)
            console.log('pos',pos)
            for(let slide of slideArray) {
                doTranslate(slide, scrollAmount, '%')
            }
            return callback;
        }

        async function addSlideAnimation(target) {
            for(let i = 0; i < target.length-1; i++) {
                target[i].classList.add('dup-slide');
            }
        }

        async function removeSlideAnimation(target) {
            for(let i = 0; i< target.length-1; i++) {
                target[i].classList.remove('dup-slide');
            }
        }

        async function teleport(direction, callback) {
            await removeSlideAnimation(slideArray)
            if(direction === 'prev') {
                pos=(slideArray.length-1)-(slideOnScreen)
            }
            if(direction === 'next') {
                pos=1
            }
            await slideX()
            setTimeout(addSlideAnimation, 1, slideArray)
            return callback
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
                    el.addEventListener('click', async () => {
                        slideX('prev')
                    })
                }
                if(el.id === 'next') {
                    el.addEventListener('click', async () => {
                        slideX('next')
                    })
                }
                if(el.id === 'pos') {
                    el.addEventListener('click', () => {
                        console.log(pos)
                    })
                }
            })
        }

        buildStyles();
        buildInnerContainerListeners();
        buildSlides();
        buildControlListeners();

    })

})();