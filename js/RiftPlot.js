/**
 * Main js file for RiftPlot.
 * Idea inspired by RiftSketch: https://github.com/brianpeiris/RiftSketch
 * Code inspired by Sechelt: https://mozvr.github.io/sechelt/
 *
 * @author: bohuim (Bohui Moon)
 */


/* ----- VARS ----- */
//DOM
var canvas = null;
var e = null;

//editor
var doc = null;
var editor = null;
var texture = null;
var editorView = null;
var runTimer = null;

//Three.js
var renderer, orbit;
var camera1, scene1;
var camera2, scene2;

//VR
var vrEffect, vrControls;
var vrMode = false;

//Mathbox
var context = null;
var mathbox = null;
var view = null;

//Other
var stats = null;
var wrapper = null;



/* ----- SETUP ----- */
/**
 * Master init function.
 */
function init()
{
	/* DOM */
	canvas = document.getElementById('view');
	e = document.getElementById('e');

	initThreejs();
	initMathbox();
	initEditor();

  	wrapper = new Wrapper(mathbox);

  	/* stats.js */
	stats = new Stats();
	stats.setMode(0);
	stats.domElement.id = "stats";
	document.body.appendChild(stats.domElement);

  	//attach event callbacks
  	window.addEventListener('resize', onWindowResize);
  	document.addEventListener('fullscreenchange', onFullscreenChange);
	document.addEventListener('mozfullscreenchange', onFullscreenChange);


	requestAnimationFrame(animate);
	editor.focus();
}

/**
 * Initialize Three.js
 */
function initThreejs()
{
	renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
	renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
	renderer.setClearColor(0xffffff);

	//Main 
	scene1 = new THREE.Scene();
	camera1 = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
	camera1.position.set(3, 0, 0);
	camera1.up.set(0, 0, 1);

	orbit = new THREE.OrbitControls(camera1, document, renderer.domElement);
	// orbit = new THREE.TrackballControls(camera);
	// orbit.rotateSpeed = 2.0;
	// orbit.zoomSpeed = 1.2;
	// orbit.panSpeed = 0.8;
	// orbit.noZoom = false;
	// orbit.noPan = true;
	// orbit.staticMoving = true;
	// orbit.dynamicDampingFactor = 0.3;
	// orbit.keys = [ 65, 83, 68 ];


	//Editor view
	scene2 = new THREE.Scene();
	camera2 = new THREE.OrthographicCamera();
}

/**
 * Initialize MathBox context using already created main Three.js scene and camera.
 */
function initMathbox()
{
	context = new MathBox.Context(renderer, scene, camera).init();
	mathbox = context.api;
	context.resize({viewWidth: canvas.offsetWidth, viewHeight: canvas.offsetHeight});
}

/**
 *
 */
function initEditor()
{
	var CanvasTextEditor = require('CanvasTextEditor');
    var Document = require('Document');
	doc = new Document('asdfasdfs');
	editor = new CanvasTextEditor(doc);

    document.body.appendChild(editor.getEl());
    editor.resize(256, 256);
}

/**
 *
 */
function initVR()
{
	vrControls = new THREE.VRControls(camera);
  	vrEffect = new THREE.VREffect(renderer);
  	vrEffect.setSize(canvas.offsetWidth, canvas.offsetHeight);
}


/* ----- RENDERING ----- */
/**
 * Called every frame.
 * Calculate animations and recursively calls itself
 */
function animate(delta)
{
	stats.begin();

	orbit.update();
	vrControls.update();

	texture.needsUpdate = true;

	editorView.position.set(0, 2, -2);
	editorView.lookAt( camera.getWorldDirection().multiplyScalar(-1) );
	editorView.up.copy( camera.up );

	if (context !== null)
		context.frame();

	if (vrMode)
    	vrEffect.render(scene, camera);
    else
    	renderer.render(scene, camera);

    stats.end();

    requestAnimationFrame(animate);
}



/* ----- EVENTS & CALLBACKS ----- */
/**
 * Event for VR mode toggle button click.
 * Switch mode, request full screen, and call resize handler.
 *
 * @source Sechelt
 */
$('#vr-toggle').click(function()
{
 	vrMode = vrMode ? false : true;
 	requestFullscreen();
 	onWindowResize();
});

/**
 * Called when user presses down on a key while in textarea.
 * Stop the event propagation so that graph receive modifiers while editing.
 */
$("#editor").keydown(function(e){
	e.stopPropagation();
});

/**
 * Called when user finishes typing a character into the textarea
 */
$("#editor").keyup(function(e)
{
	clearTimeout(runTimer);

	runTimer = setTimeout(function(){
		run();
	}, 1000);
});


/**
 * Called when user pressed "run" button
 */
$("#run-button").click(function(e)
{
	run();
});

/**
 * Set effect to full screen on desktop.
 * Call corresponding handler for mobile (FF/Chrome).
 *
 * @source Sechelt
 */
function requestFullscreen()
{
	var el = renderer.domElement;

	if (!isMobile())
	{
    	vrEffect.setFullScreen(true);
    	return;
  	}

  	//mobile
  	if (el.requestFullscreen)
    	el.requestFullscreen();
  	else if (el.mozRequestFullScreen)
    	el.mozRequestFullScreen();
  	else if (el.webkitRequestFullscreen)
    	el.webkitRequestFullscreen();
}

/**
 * Callback for full screen change.
 *
 * @source Sechelt
 */
function onFullscreenChange(e)
{
	var fsElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

  	if (!fsElement)
    	vrMode = false;
//	else
//    	window.screen.orientation.lock('landscape'); // lock screen if mobile
}


/**
 * Callback for window resize.
 * Recalculate and fix perspective camera aspect.
 * Depending on vrMode, apply change to effect or renderer instances.
 *
 * @source Sechelt
 */
function onWindowResize()
{
	camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
	camera.updateProjectionMatrix();

  	if (vrMode)
    	vrEffect.setSize(canvas.offsetWidth, canvas.offsetHeight);
    else
    	renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
}

/**
 * Run & parse the MathBox.
 * First remove everything
 */
function run()
{
	mathbox.remove("*");
  	wrapper._resetManipulateSeen();

	var interpret = new Function(e.value);
	interpret();
  	wrapper._removeOldManipulatePlot3D();

	//mathbox.select('cartesian').set('rotation', [-Math.PI/2, 0, Math.PI/2]);
}


/* ----- HELPERS ----- */
/**
 * Checks whether client is mobile.
 *
 * @return true if mobile; false otherwise.
 * @source Sechelt
 */
var isMobile = function()
{
	var check = false;
  	(function (a)
  	{
    	if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
      		check = true;
	})
	(navigator.userAgent || navigator.vendor || window.opera);
	return check;
};
