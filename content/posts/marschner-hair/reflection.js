import {float2, float3, float4, mat4x4, mul, dot, Camera, OrthonormalBasis, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, 
    refract, negative, projectToPlane, reflect, CylinderY,clamp, LineSegment,
    project} from "./math.js"

const canvas = document.querySelector('.hair-reflection'); 
let width = canvas.width = Math.min(innerWidth, 300);
let height = canvas.height = Math.min(innerWidth, 300);

const ctx = canvas.getContext('2d');

const thetaPicker = document.querySelector('#hair-reflection-theta');

const output1 = document.querySelector('.hair-reflection-theta');
let clearColor = "#2b2b2b";

let theta = degToRad(thetaPicker.value);

thetaPicker.addEventListener('input', () => {
    output1.textContent = `${thetaPicker.value}°`;
    theta = degToRad(clamp(thetaPicker.value, -89.5, 89.5));

});

function resizeCanvas()
{
    width = canvas.width = Math.min(innerWidth, 300);
    height = canvas.height = Math.min(innerWidth, 300);
    camera.aspectRatio = width / height;
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
    dx = e.clientX - lastPosition.x;
    dy = e.clientY - lastPosition.y;
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
// }, 
// {
//     passive: true
// });

let camera = new Camera(degToRad(30.0), width / height, 0.1, 1000);
camera.distance = 2.1;
camera.focus.x = 0;
camera.focus.y = 0.25;

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
        camera.rotation.z += 0.01;
    }
    
    if(isLeftMouseDown)
    {
        theta += 0.5 * dx * dt / 1000.0;
        theta = clamp(theta, degToRad(0), degToRad(89.5));

        thetaPicker.value = radToDeg(theta);
        output1.textContent = radToDeg(theta).toFixed(0).toString() + "°";
    }
    // camera.onMouse(dx, dy, isLeftMouseDown ? 0 : (isRightMouseDown ? 1 : -1));
    // camera.update(dt);
}

function drawLine(p0, p1, camera)
{
    let q = new float4(p0, 1);
    let r = new float4(p1, 1);
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
    
    ctx.lineWidth = 2;
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
    
    ctx.setLineDash(dashed);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.setLineDash([])

    const n0 = normalize(new float2(p1.x - p0.x, p1.y - p0.y));
    const t0 = new float2(n0.y, -n0.x);
    const p2 = new float2(p1.x - lineWidth * 2.5 * t0.x - n0.x * lineWidth*5, p1.y - lineWidth*2.5 * t0.y - n0.y * lineWidth*5);
    const p3 = new float2(p1.x + lineWidth * 2.5 * t0.x - n0.x * lineWidth*5, p1.y + lineWidth*2.5 * t0.y - n0.y * lineWidth*5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.fill();
}

function drawLineArrow(pp0, pp1, lineWidth = 1, color = "white", dashed = [])
{
    let q = new float4(pp0, 1);
    let r = new float4(pp1, 1);
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
    
    const p0 = new float2(x0, y0);
    const p1 = new float2(x1, y1);

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();

    const n0 = normalize(new float2(p1.x - p0.x, p1.y - p0.y));
    const t0 = new float2(n0.y, -n0.x);
    const p2 = new float2(p1.x - lineWidth * 2.5 * t0.x - n0.x * lineWidth*5, p1.y - lineWidth*2.5 * t0.y - n0.y * lineWidth*5);
    const p3 = new float2(p1.x + lineWidth * 2.5 * t0.x - n0.x * lineWidth*5, p1.y + lineWidth*2.5 * t0.y - n0.y * lineWidth*5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.fill();
}

function drawText(p, text, color = "white", font = "14px monospace", align = "left")
{
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, p.x, p.y);
}

function projectPointToScreen(point, width, height, viewProjection)
{
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

camera.update(0);
function draw()
{
    let currentTick = performance.now();
    dt = currentTick - previousTick;
    previousTick = currentTick;
 
    update(dt);
    const view = camera.view;
    const forward = camera.forward;
    const up = camera.up;
    const right = camera.right;
    const position = camera.position;
    const projection = camera.projection;
    let viewProjection = mul(view, projection);
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, width, height);

    const angle = theta;
    const hairHeight = 0;
    const wi = normalize(new float2(Math.cos(angle + Math.PI/2), Math.sin(angle + Math.PI/2)));
    const ray = new Ray(new float2(0, 0.00001), wi.neg());

    const lineSegments1 = [];
    const lineSegment5 = new LineSegment(new float2(-0.5, hairHeight), new float2(0.5, hairHeight));
    lineSegments1.push(lineSegment5);
    ctx.strokeStyle = "white";
    drawLine(new float3(lineSegment5.a), new float3(lineSegment5.b), camera);

    const lineSegments = [];
    const numberOfLines = 16;
    const dxx = Math.abs(lineSegment5.b.x - lineSegment5.a.x) / numberOfLines;

    for(let i = 0; i <= numberOfLines; i++)
    {
        let start = new float2(lineSegment5.b.x - i * dxx, 0);
        let end = new float2(lineSegment5.b.x - dxx * 0.5 - i * dxx, -0.05);
        const segment = new LineSegment(start, end);
        drawLine(new float3(segment.a), new float3(segment.b), camera);

    }

    function intersectScene1(ray, tMin, tMax)
    {
        let t = Infinity;
        let closestIntersection = null;
        for(const lineSegment of lineSegments1)
        {
            const intersection = lineSegment.intersect(ray, 0, 1);
            if(intersection.hit)
            {
                if(intersection.t < t)
                {
                    t = intersection.t;
                    closestIntersection = intersection;
                }
            }
        }
        return closestIntersection;
    }

    let trt = null;
    let r = null;
    let tt = null;
    // intersections for a smooth cylinder
    {
        const intersection = intersectScene1(ray, 0, 100);
        if(intersection !== null && intersection.hit)
        {
            const p = projectPointToScreen(intersection.position, width, height, viewProjection);
            const p1 = projectPointToScreen(intersection.position.add(wi.mul(0.5)), width, height, viewProjection);
            const p3 = projectPointToScreen(intersection.position.add(intersection.normal.mul(0.5)), width, height, viewProjection);

            drawCircle(p, 5);
            ctx.strokeStyle = "green";
            drawLineArrow(new float3(intersection.position), new float3(intersection.position.add(wi.mul(0.5))), 2, "white");
            const R = reflect(ray.direction.neg(), intersection.normal);
            r = R;
            ctx.strokeStyle = "yellow";
            // drawLine(new float3(intersection.position), new float3(intersection.position.add(R)), camera);

            drawText(p1.add(normalize(p1.sub(p)).mul(8)), "wi", "white", "16px monospace", "center");
            

            const p2 = projectPointToScreen(new float3(intersection.position.add(R.mul(0.5))), width, height, viewProjection);
            drawText(p2.add(normalize(p2.sub(p)).mul(8)), "R", "red", "16px monospace", "center");
            drawLineArrow(new float3(intersection.position), new float3(intersection.position.add(R.mul(0.5))), 2, "red");
            
            ctx.strokeStyle = "green";
            // drawLine(new float3(intersection.position), new float3(intersection.position.add(normalize(intersection.normal))), camera);
            drawLineArrow(new float3(intersection.position), new float3(intersection.position.add(normalize(intersection.normal).mul(0.5))), 2, "rgb(0 255 0)");
            drawText(p3.add(normalize(p3.sub(p)).mul(8)), "N", "rgb(0 255 0)", "16px monospace", "center");

            ctx.strokeStyle = "white";

            const a = new float3(intersection.position.add(wi.mul(0.125)));
            const b = new float3(intersection.position.add(normalize(intersection.normal).mul(0.125)));
            // const b = new float3(intersection.position.add(new float2(-1, 0).mul(0.5)));
            const c = new float3(intersection.position.add(R.mul(0.125)));

            // const angle = Math.acos(dot(wi.neg(), intersection.normal));
            // const angle = Math.acos(dot(wi.neg(), new float2(-1, 0)));
            // ctx.beginPath();
            // ctx.arc(p.x, p.y, 50, degToRad(270), degToRad(360) - angle, true);
            // ctx.stroke();

            const angle = Math.acos(dot(wi, new float2(0, 1)));
            ctx.beginPath();
            ctx.arc(p.x, p.y, 50, -Math.PI/2, -Math.PI/2 - angle, true);
            ctx.stroke();

            const angle1 = Math.acos(dot(R, new float2(0, 1)));
            ctx.beginPath();
            ctx.arc(p.x, p.y, 50, -Math.PI/2 , -Math.PI/2 + angle1);
            ctx.stroke();

            const midpoint = a.add(b).mul(0.5);
            const midpoint1 = c.add(b).mul(0.5);
            const p_mid = projectPointToScreen(midpoint, width, height, viewProjection);
            const p_mid1 = projectPointToScreen(midpoint1, width, height, viewProjection);
            drawText(p_mid, `θ`, undefined, "16px monospace", "center");
            drawText(p_mid1, `θ`, undefined, "16px monospace", "center");

            drawText(new float2(16, 32), `θ: ${radToDeg(theta).toFixed(0)}°`, undefined, "16px monospace", "left");
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
