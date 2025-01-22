import {float2, float3, float4, mat3x3, mat4x4, mul, dot, Camera, OrthographicCamera, OrthonormalBasis, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, distance,
    reflect, refract, negative, projectToPlane, clamp,
    project} from "./math.js"

const canvas = document.querySelector('.M-function-plot');
// const width = canvas.width;
// const height = canvas.height;

let width = canvas.width =  Math.min(innerWidth, 512);
let height = canvas.height =  Math.min(innerWidth, 512);

const ctx = canvas.getContext('2d');

const betaPicker = document.querySelector('#M-function-plot-beta');
const alphaPicker = document.querySelector('#M-function-plot-alpha');
const resetButton = document.querySelector('#M-function-plot-reset');

const output = document.querySelector('.M-function-plot-beta');
const output1 = document.querySelector('.M-function-plot-alpha');

let beta = degToRad(Math.max(betaPicker.value, 0.5));
let alpha = degToRad(clamp(alphaPicker.value, -10, 10));

betaPicker.addEventListener('input', () => {
    output.textContent = betaPicker.value + "°";
    beta = degToRad(Math.max(betaPicker.value, 0.5));
});

alphaPicker.addEventListener('input', () => {
    output1.textContent = alphaPicker.value + "°";
    alpha = degToRad(clamp(alphaPicker.value, -89.4, 89.4));
});

resetButton.addEventListener("click", () => {

    camera.distance = 1;
    camera.focus.y = 1;
    camera.focus.x = 0;
});

let clearColor = "black";
// let clearColor = "#2b2b2b";


function resizeCanvas()
{
    width = canvas.width = Math.min(innerWidth, 512);
    height = canvas.height = Math.min(innerWidth, 512);
}

window.addEventListener('resize', resizeCanvas, false);

ctx.fillStyle = 'rgb(0,0,0)';
ctx.fillRect(0, 0, width, height);

let curX;
let curY;
let pressed = false;
let keyPressed;
let isLeftMouseDown = false;
let isRightMouseDown = false;
let mouseWheelDeltaY = 0;

let position = new float3(0, 0, -3);
const focus = new float3(0, 0, 0);
let up = new float3(0, 1, 0);

let frameCount = 0;
let previousTick = performance.now();
let dt = 0;

let lastPosition = {};
let dx = 0;
let dy = 0;

window.addEventListener('mousemove', updatePosition);

function touchToMouse(event)
{
    let e = event.touches[0];
    curX = e.offsetX;
    curY = e.offsetY;
    // if(typeof(lastPosition.x) != 'undefined')
    // if(isLeftMouseDown || isRightMouseDown)
    {
            dx = e.clientX - lastPosition.x;
            dy = e.clientY - lastPosition.y;
    }
    lastPosition = {x : e.clientX, y : e.clientY};
}

function touchStart(event)
{
    if(event.target !== canvas)
    {
        return;
    }
    let e = event.touches[0];
    isLeftMouseDown = true;
    lastPosition = {x : e.clientX, y : e.clientY};
}

function touchEnd(event)
{
    isLeftMouseDown = false;
}

canvas.addEventListener('touchmove', touchToMouse);
canvas.addEventListener('touchstart', touchStart);
canvas.addEventListener('touchend', touchEnd);

window.addEventListener("touchmove", (e) => {if(e.target == canvas) e.preventDefault();}, {passive:false});
window.addEventListener("touchstart", (e) => {if(e.target == canvas) e.preventDefault();}, {passive:false});
window.addEventListener("touchend", (e) => {if(e.target == canvas) e.preventDefault();}, {passive:false});
// window.addEventListener("wheel", (e) => {if(e.target == canvas) e.preventDefault();}, {passive:false});

canvas.addEventListener("mousedown", e => {
    pressed = true;
    switch(e.button)
    {
        case 0:
            isLeftMouseDown = true;
            break;
        case 2:
            isRightMouseDown = true;
            break;
    }
});

function updatePosition(e)
{
    curX = e.offsetX;
    curY = e.offsetY;
    // if(typeof(lastPosition.x) != 'undefined')
    if(isLeftMouseDown || isRightMouseDown)
    {
            dx = e.movementX;
            dy = e.movementY;
    }

    lastPosition = {x : e.clientX, y : e.clientY};
}

window.addEventListener("mouseup", e => {
    pressed = false;
    switch(e.button)
    {
        case 0: 
            isLeftMouseDown = false;
            break;
        case 2:
            isRightMouseDown = false;
         break;
    }
});


// canvas.addEventListener("wheel", e => {
//     mouseWheelDeltaY = e.deltaY;
//     camera.distance += e.deltaY * 0.001;
// }, {
//     passive: true
//   });

let camera = new OrthographicCamera(3, 3, 0.1, 1000);

camera.distance = 1;
camera.focus.y = 1;
let rotX = 0;
let rotY = 0;
let rotZ = 0;
let direction = new float3(0, 0, -1);
let forward = new float3(0, 0, -1);
let right = new float3(1, 0, 0);
let movementAmount = new float3(0, 0, 0);

let keymap = new Array(256);

canvas.addEventListener("keydown", (e) =>
{
    keyPressed = e.key;
    keymap[e.key] = true;
});
    
canvas.addEventListener("keyup", (e) =>
{
    keymap[e.key] = false;
});

function update(dt)
{
    if(keymap["w"])
    {
        movementAmount.y = 1;
    }
    if(keymap["s"])
    {
        movementAmount.y = -1;
    }
    
    if(keymap["a"])
    {
        movementAmount.x = 1;
    }
    if(keymap["d"])
    {
        movementAmount.x = -1;
    }

    if(keymap["q"])
    {
        camera.rotation.z += -0.01;
        movementAmount.z = -1;
    }
    if(keymap["e"])
    {
        movementAmount.z = 1;
        camera.rotation.z += 0.01;
    }
    // camera.aspectRatio = innerWidth / innerHeight;
    // width = canvas.width = innerWidth;
    // height = canvas.height = innerHeight;
    // camera.fudge = 180;
    // camera.onMouse(dx, dy, isLeftMouseDown ? 0 : (isRightMouseDown ? 1 : -1));
    if(isRightMouseDown)
    {
        camera.distance += (dy * 0.002);
        camera.distance = Math.max(camera.distance, 0.01);

    }
    if(isLeftMouseDown)
    {

        camera.movement.x = -dx * 0.01 * Math.exp(-camera.distance);
        camera.movement.y = dy * 0.01 * Math.exp(-camera.distance);
    }

    camera.update(dt);

}

function drawLine(p0, p1, camera, lineWidth = 2)
{
    let q = new float4(new float3(p0), 1);
    let r = new float4(new float3(p1), 1);
    const viewProjection = mul(camera.view, camera.projection);
    q = mul(q, viewProjection);
    r = mul(r, viewProjection);
    if(q.w <= 0 || r.w <= 0)
    {
        return;
    }
    q = q.div(q.w);
    r = r.div(r.w);

    let x0 = (q.x * 0.5 + 0.5) * width;
    let y0 = (-q.y * 0.5 + 0.5) * height;

    let x1 = (r.x * 0.5 + 0.5) * width;
    let y1 = (-r.y * 0.5 + 0.5) * height;
    
    
    // ctx.strokeStyle = "rgb(255 0 0)";
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function drawLine2D(p0, p1, lineWidth = 1, color = "white", dashed = [])
{
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.setLineDash(dashed);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.restore();
}

function drawLineArrow2D(p0, p1, lineWidth = 1, color = "white", dashed = [])
{
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    const n0 = normalize(new float2(p1.x - p0.x, p1.y - p0.y));
    const t0 = new float2(n0.y, -n0.x);
    const p2 = new float2(p1.x - 5 * t0.x - n0.x * 10, p1.y - 5 * t0.y - n0.y * 10);
    const p3 = new float2(p1.x + 5 * t0.x - n0.x * 10, p1.y + 5 * t0.y - n0.y * 10);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.fill();
}

function drawText(p, text, color = "white", font = "14px monospace", align = "center")
{
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, p.x, p.y);
}

function projectPointToScreen(point, width, height, viewProjection)
{
    if(point instanceof float2)
    {
        point = new float4(point.x, point.y, 0, 1);
    }
    const result = mul(new float4(point.x, point.y, point.z, 1), viewProjection);
    const projectedX = ((result.x / result.w) * 0.5 + 0.5) * width;
    const projectedY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height;
    return new float2(projectedX, projectedY);
}

function drawCircle(position, radius = 5, style = "white")
{
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(position.x, position.y, radius, degToRad(0), degToRad(360), false);
    ctx.fill();   
}


function gaussian(beta, x, mean)
{
    return (1 / (beta * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(x - mean, 2) / (beta * beta));
}

camera.update(0);
function draw()
{
    let currentTick = performance.now();
    dt = currentTick - previousTick;
    previousTick = currentTick;
 
    update(dt);

    let viewProjection = mul(camera.view, camera.projection);
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, width, height);

    // Draw Axes
    ctx.strokeStyle = "white";
    drawLine(new float3(-1000,0,0), new float3(1000,0,0), camera);

    ctx.strokeStyle = "white";
    drawLine(new float3(0, 0, 0), new float3(0,25,0), camera);

    {
        
        let y_axis = [];
        let x_axis = [];
        let points = [];
        let maxR = -Infinity;
        let integral = 0;
        let n = 1000;
        let a = -Math.PI;
        let b = Math.PI;
        let h = (b - a) / n;

        for (let i = 0; i < n; ++i)
        {
            let thetaH = a + (i + 0.5) * h;
            let Mp0 = gaussian(beta, thetaH - alpha, 0);
            let point = new float2(thetaH, Mp0);
            y_axis.push(Mp0);
            x_axis.push(thetaH);
            points.push(point);
            if(maxR < Mp0)
            {
                maxR = Mp0;
            }
            integral += Mp0;
        }
        integral *= h;
        drawText(new float2(16, 16), `max value: ${maxR.toFixed(3)}`, undefined, undefined, "left");
        drawText(new float2(16, 32), `integral: ${integral.toFixed(3)}`, undefined, undefined, "left");
        ctx.save();
        ctx.strokeStyle = "rgb(0 128 255)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i = 0; i < points.length; ++i)
        {
            const p = projectPointToScreen(points[i].mul(1), width, height, viewProjection);
            if(i == 0)
            {
                ctx.moveTo(p.x, p.y);
            }
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
        // x-axis
        {
            const n = 10;
            const a = 0;
            const b = 2;
            const dx = 0.5;

            const textPos = projectPointToScreen(new float2(0, 0).add(new float2(0, -0.1)), width, height, viewProjection);
            drawText(textPos, "θ_h");
            for(let i = 1; i < n; ++i)
            {
                const point = new float2(a + i * dx, 0);
                const point1 = new float2(a - i * dx, 0);
                const p = projectPointToScreen(point.add(new float2(0, 0.025)), width, height, viewProjection);
                drawLine(point, point.add(new float2(0, 0.025)), camera, 2);
                drawText(p, `${i * dx}`, "white", undefined, "center");
                const p1 = projectPointToScreen(point1.add(new float2(0, 0.025)), width, height, viewProjection);
                drawLine(point1, point1.add(new float2(0, 0.025)), camera, 2);
                drawText(p1, `-${i * dx}`, "white", undefined, "center");
            }
        }
    }

    {
        const n = 25;
        const a = 0;
        const b = 2;
        const dy = 0.5;
        ctx.strokeStyle = "white";
        for(let i = 0; i < n; ++i)
        {
            const point = new float2(0, a + i * dy);
            const p = projectPointToScreen(point.add(new float2(0.05, 0)), width, height, viewProjection);
            drawLine(point, point.add(new float2(0.05, 0)), camera, 2);
            drawText(p, `${i * dy}`, "white", undefined, "left");
        }
        
    }

    mouseWheelDeltaY = 0;
    dx = 0;
    dy = 0;
    movementAmount.x = 0;
    movementAmount.y = 0;
    movementAmount.z = 0;
    frameCount++;
    requestAnimationFrame(draw);
}

draw();
