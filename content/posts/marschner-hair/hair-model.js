import {float2, float3, float4, mat4x4, mul, dot, Camera, OrthonormalBasis, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, 
    refract, negative, projectToPlane, reflect, CylinderY,clamp, LineSegment,
    project} from "./math.js"

const canvas = document.querySelector('.hair-model'); 
let width = canvas.width = Math.min(innerWidth, 512);
let height = canvas.height = Math.min(innerWidth, 512);

const ctx = canvas.getContext('2d');

const alphaPicker = document.querySelector('#hair-model-alpha');
const thetaPicker = document.querySelector('#hair-model-theta');
const iorPicker = document.querySelector('#hair-model-ior');
// const testerPicker = document.querySelector('#tester');

const output = document.querySelector('.hair-model-alpha');
const output1 = document.querySelector('.hair-model-theta');
const output2 = document.querySelector('.hair-model-ior');
// const output2 = document.querySelector('.output2');
let clearColor = "#2b2b2b";

let alpha = degToRad(alphaPicker.value);
let theta = degToRad(thetaPicker.value - 90);
let ior = Number(iorPicker.value);
let eccentricity = 0.9;

alphaPicker.addEventListener('input', () => {
    output.textContent = `${alphaPicker.value}°`;
    alpha = degToRad(clamp(alphaPicker.value, -89.4, 89.4));
});

thetaPicker.addEventListener('input', () => {
    output1.textContent = `${thetaPicker.value}°`;
    theta = degToRad(thetaPicker.value - 90);

});

iorPicker.addEventListener('input', () => {
    output2.textContent = `${iorPicker.value}`;
    ior = Number(iorPicker.value);
});

function resizeCanvas()
{
    width = canvas.width = Math.min(innerWidth, 512);
    height = canvas.height = Math.min(innerWidth, 512);
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
camera.distance = 9.5;
camera.focus.x = 2.29;
camera.rotation.x = 1.25;
camera.rotation.y = 5.5;

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
        alpha += 0.02 * dx * dt / 1000.0;
        alpha = clamp(alpha, degToRad(0), degToRad(8));

        alphaPicker.value = radToDeg(alpha);
        output.textContent = radToDeg(alpha).toFixed(0).toString() + "°";
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

function drawArcBetweenPoints(a, b, c, radius = 0.5, style = "white", viewProjection)
{
    a = normalize(a);
    b = normalize(b);
    const gamma = Math.acos(dot(normalize(a), normalize(b)));
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = style;
    for(let t = 0; t < 1; t += 0.1)
    {
        const p = a.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * radius).add(b.mul(Math.sin(t * gamma) / Math.sin(gamma) * radius));
        const projected = projectPointToScreen(p.add(c), width, height, viewProjection);
        if(t === 0)
        {
            ctx.moveTo(projected.x, projected.y);
            continue;
        }
        ctx.lineTo(projected.x, projected.y);
    }
    ctx.stroke();
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
    const scaleWidth = 0.5;
    const hairHeight = 1;
    // const a  = new float2(0, hairHeight);
    // const b = new float2(scaleWidth, hairHeight + scaleWidth * Math.tan(alpha));
    
    const a  = new float2(scaleWidth * 0, hairHeight);
    const b = new float2(scaleWidth * 3, hairHeight + scaleWidth * Math.tan(alpha));
    const wi = normalize(new float2(Math.cos(angle), Math.sin(angle)));
    const ray = new Ray(a.add(b).mul(0.5).sub(wi.mul(0.5)), wi);
    
    const lineSegment = new LineSegment(new float2(0, hairHeight), new float2(scaleWidth, hairHeight + scaleWidth * Math.tan(alpha)));
    const lineSegment1 = new LineSegment(new float2(0, -hairHeight), new float2(scaleWidth, -hairHeight - scaleWidth * Math.tan(alpha)));
    const lineSegment2 = new LineSegment(new float2(scaleWidth, hairHeight + scaleWidth * Math.tan(alpha)), new float2(scaleWidth, hairHeight));
    const lineSegment3 = new LineSegment(new float2(scaleWidth, -hairHeight), new float2(scaleWidth*2, -hairHeight - scaleWidth * Math.tan(alpha)));

    ctx.strokeStyle = "blue";

    const lineSegments = [];
    // lineSegments.push(lineSegment);
    // lineSegments.push(lineSegment1);
    // lineSegments.push(lineSegment3);

    const lineSegments1 = [];
    const lineSegment5 = new LineSegment(new float2(0, hairHeight), new float2(9 * scaleWidth, hairHeight));
    const lineSegment6 = new LineSegment(new float2(0, -hairHeight), new float2(9 * scaleWidth, -hairHeight));
    lineSegments1.push(lineSegment5);
    lineSegments1.push(lineSegment6);
    // drawLine(new float3(lineSegment5.a), new float3(lineSegment5.b), camera);
    // drawLine(new float3(lineSegment6.a), new float3(lineSegment6.b), camera);


    // hair preview
    {
        const pos = new float2(width - 200 - 16, height - 50 - 16);
        const size = new float2(200, 50);

        const hairBaseColor = "rgb(60 40 30 / 100%)";
        const gradientBase = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + size.y);
        gradientBase.addColorStop(0, "rgb(40 30 25/ 100%)");
        gradientBase.addColorStop(0.33, hairBaseColor);
        gradientBase.addColorStop(0.66, hairBaseColor);
        gradientBase.addColorStop(1, "rgb(40 30 25 / 100%)");
        ctx.fillStyle = gradientBase;
        ctx.fillRect(pos.x, pos.y, size.x, size.y);

        ctx.globalCompositeOperation = "lighter"; // add
        const gradient = ctx.createLinearGradient(
            pos.x + size.x / 2 + Math.sin(-alpha) * 75 + Math.cos(theta) * 100 - ior * 5 - 25 - 12.5,
            0,
            pos.x + size.x / 2 + Math.sin(-alpha) * 75 + Math.cos(theta) * 100 - ior * 5 + 25 - 12.5,
            0);
        gradient.addColorStop(0, "black");
        gradient.addColorStop(0.25, "rgb(180 120 80 / 100%)");
        gradient.addColorStop(0.75, "rgb(180 120 80 / 100%)");
        gradient.addColorStop(1, "black");
        ctx.fillStyle = gradient;
        ctx.fillRect(pos.x, pos.y, size.x, size.y);

        const gradient1 = ctx.createLinearGradient(
            pos.x + size.x / 2 + Math.sin(alpha) * 50 + Math.cos(theta) * 100 - 25 - 12.5, 
            0, 
            pos.x + size.x / 2 + Math.sin(alpha) * 50 + Math.cos(theta) * 100 + 25 - 12.5,
            0);
        gradient1.addColorStop(0, "black");
        gradient1.addColorStop(0.5, "white");
        gradient1.addColorStop(1, "black");
        ctx.fillStyle = gradient1;
        ctx.fillRect(pos.x, pos.y, size.x, size.y);
        ctx.globalCompositeOperation = "source-over";
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
            const p1 = projectPointToScreen(intersection.position.add(intersection.normal.mul(0.5)), width, height, viewProjection);
            // drawCircle(p, 5);
            ctx.strokeStyle = "green";
            // drawLine(new float3(intersection.position), new float3(intersection.position.add(intersection.normal)), camera);
            const R = reflect(ray.direction.neg(), intersection.normal);
            r = R;
            ctx.strokeStyle = "yellow";
            // drawLine(new float3(intersection.position), new float3(intersection.position.add(R)), camera);

            drawLine(new float3(intersection.position), new float3(intersection.position.add(normalize(intersection.normal))), camera);
            ctx.setLineDash([5, 8]);
            ctx.strokeStyle = "rgb(255 255 255 / 50%)";
            drawLine(new float3(intersection.position), new float3(intersection.position.add(new float2(-1, 0))), camera);
            ctx.setLineDash([]);
            
            ctx.strokeStyle = "white";

            const a = new float3(intersection.position.add(wi.neg().mul(0.5)));
            const b = new float3(intersection.position.add(intersection.normal.mul(0.5)));
            // const b = new float3(intersection.position.add(new float2(-1, 0).mul(0.5)));

            const angle = Math.acos(dot(wi.neg(), intersection.normal));
            // const angle = Math.acos(dot(wi.neg(), new float2(-1, 0)));


            const midpoint = a.add(b).mul(0.5);
            const p_mid = projectPointToScreen(midpoint, width, height, viewProjection);
            const v_mid = normalize(p_mid.sub(p));
            // ctx.beginPath();
            // ctx.arc(p.x, p.y, p_mid.distance(p), degToRad(-90 - radToDeg(angle)), degToRad(-90));
            // ctx.stroke();
            drawArcBetweenPoints(wi.neg(), intersection.normal, intersection.position, 0.5, "white", viewProjection);

            drawText(p_mid.sub(v_mid.mul(16)), `θ`, undefined, "16px monospace", "center");
            // drawText(new float2(16, 32), `θ: ${radToDeg(theta).toFixed(0)}°`, undefined, "16px monospace", "left");
    
            const Rt = refract(ray.direction, intersection.normal, 1 / ior);
            ctx.strokeStyle = "purple";
            // drawLine(new float3(intersection.position), new float3(intersection.position.add(Rt)), camera);
            const ray1 = new Ray(intersection.position.add(normalize(intersection.normal).mul(-0.01)), Rt.mul(100));
            // const intersection1 = lineSegment1.intersect(ray1, 0, 100);
            const intersection1 = intersectScene1(ray1, 0, 100);
    
            if(intersection1 !== null && intersection1.hit)
            {
                const p1 = projectPointToScreen(intersection1.position, width, height, viewProjection);
                // drawCircle(p1, 5);
                
                ctx.strokeStyle = "green";
                // drawLine(new float3(intersection1.position), new float3(intersection1.position.add(intersection1.normal)), camera);
    
                const R1 = reflect(normalize(ray1.direction.neg()), intersection1.normal);
                ctx.strokeStyle = "yellow";
                // drawLine(new float3(intersection1.position), new float3(intersection1.position.add(R1)), camera);
        
                const Rt1 = refract(normalize(ray1.direction), intersection1.normal, ior);
                ctx.strokeStyle = "purple";
                tt = Rt1;
                // drawLine(new float3(intersection1.position), new float3(intersection1.position.add(Rt1)), camera);
                const ray2 = new Ray(intersection1.position.add(normalize(intersection1.normal).mul(0.01)), R1.mul(1000));
                const intersection2 = intersectScene1(ray2, 0, 100);
    
                if(intersection2 !== null && intersection2.hit)
                {
                    const p1 = projectPointToScreen(intersection2.position, width, height, viewProjection);
                    // drawCircle(p1, 5);
                    ctx.strokeStyle = "green";
                    // drawLine(new float3(intersection2.position), new float3(intersection2.position.add(intersection2.normal)), camera);
        
                    const R2 = reflect(normalize(ray2.direction.neg()), intersection2.normal);
                    ctx.strokeStyle = "yellow";
                    // drawLine(new float3(intersection2.position), new float3(intersection2.position.add(R2)), camera);
            
                    const Rt2 = refract(normalize(ray2.direction), intersection2.normal.neg(), ior);
                    ctx.strokeStyle = "purple";
                    // drawLine(new float3(intersection2.position), new float3(intersection2.position.add(Rt2)), camera);
                    trt = Rt2;
                }
                
            }
    
    
        }
    }

    
    for(let i = 0; i < 9; ++i)
    {
        const lineSegment = new LineSegment(new float2(i * scaleWidth, hairHeight), new float2((i + 1) * scaleWidth, hairHeight + scaleWidth * Math.tan(alpha)));
        // const lineSegment1 = new LineSegment(new float2(i * scaleWidth, -hairHeight), new float2((i + 1) * scaleWidth, -hairHeight - scaleWidth * Math.tan(alpha)));
        lineSegments.push(lineSegment);
        // lineSegments.push(lineSegment1);
        const lineSegment2 = new LineSegment(new float2((i + 1) * scaleWidth, hairHeight + scaleWidth * Math.tan(alpha)), new float2((i + 1) * scaleWidth, hairHeight));
        const lineSegment3 = new LineSegment(new float2((i + 1) * scaleWidth, -hairHeight - scaleWidth * Math.tan(alpha)), new float2((i + 1) * scaleWidth, -hairHeight));
        lineSegments.push(lineSegment2);
        // lineSegments.push(lineSegment3);
    }

    for(let i = 8; i >= 0; --i)
    {
        const lineSegment1 = new LineSegment(new float2(i * scaleWidth, -hairHeight), new float2((i + 1) * scaleWidth, -hairHeight - scaleWidth * Math.tan(alpha)));
        const lineSegment3 = new LineSegment(new float2((i + 1) * scaleWidth, -hairHeight - scaleWidth * Math.tan(alpha)), new float2((i + 1) * scaleWidth, -hairHeight));
        lineSegments.push(lineSegment3);
        lineSegments.push(lineSegment1);
    }
    ctx.strokeStyle = "white";
    

    let region = new Path2D();
    for(let i = 0; i < lineSegments.length; ++i)
    {
        const lineSegment = lineSegments[i];
        const a = projectPointToScreen(lineSegment.a, width, height, viewProjection);
        const b = projectPointToScreen(lineSegment.b, width, height, viewProjection);

        if(i === 0)
        {
            region.moveTo(a.x, a.y);
            region.lineTo(b.x, b.y);
            continue;
        }
        if(i > lineSegments.length / 2)
        {

            region.lineTo(b.x, b.y);
            region.lineTo(a.x, a.y);
        }
        else
        {
            region.lineTo(a.x, a.y);
            region.lineTo(b.x, b.y);
        }

    }
    region.closePath();
    ctx.fillStyle = "#472F22";
    ctx.fill(region, "evenodd");

    for(let i = 0; i < 9; ++i)
    {
        const lineSegment = new LineSegment(new float2(i * scaleWidth, hairHeight), new float2((i + 1) * scaleWidth, hairHeight + scaleWidth * Math.tan(alpha)));
        const lineSegment2 = new LineSegment(new float2((i + 1) * scaleWidth, hairHeight + scaleWidth * Math.tan(alpha)), new float2((i + 1) * scaleWidth, hairHeight));
        drawLine(new float3(lineSegment.a), new float3(lineSegment.b), camera);
        if(i != 8)
        {
            drawLine(new float3(lineSegment2.a), new float3(lineSegment2.b), camera);
        }
    }
    
    for(let i = 0; i < 9; ++i)
    {
        const lineSegment1 = new LineSegment(new float2(i * scaleWidth, -hairHeight), new float2((i + 1) * scaleWidth, -hairHeight - scaleWidth * Math.tan(alpha)));
        const lineSegment3 = new LineSegment(new float2((i + 1) * scaleWidth, -hairHeight - scaleWidth * Math.tan(alpha)), new float2((i + 1) * scaleWidth, -hairHeight));
        drawLine(new float3(lineSegment1.a), new float3(lineSegment1.b), camera);
        if(i != 8)
        {
            drawLine(new float3(lineSegment3.a), new float3(lineSegment3.b), camera);
        }
    }
    
    {
        const a = new float2((8 + 1) * scaleWidth, hairHeight + scaleWidth * Math.tan(alpha));
        const b = new float2((8 + 1) * scaleWidth, -hairHeight - scaleWidth * Math.tan(alpha));
     
        let canvasPos = new float2(0, 0);
        const v = new float4(0, 0, 0, 1);
        const result = mul(v, viewProjection);
        const originScreenX = ((result.x / result.w) * 0.5 + 0.5) * width + canvasPos.x;
        const originScreenY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height + canvasPos.y;
        // const p1 = new float2(originScreenX, originScreenY);

        let inc = -Math.PI / 36;
        let angle = 0.0;
        let vertices = [];
        let vertices1 = [];
        let vertices2 = [];
        let vertices3 = [];
        let vertices4 = [];


        for (let i = 0; i <= 36; i++)
        {
            let v4 = new float4(6 * scaleWidth, Math.cos(angle), Math.sin(angle) * eccentricity, 1);
            let result4 = mul(v4, viewProjection);
            const originScreenX4 = ((result4.x / result4.w) * 0.5 + 0.5) * width + canvasPos.x;
            const originScreenY4 = (1 - (((result4.y / result4.w)) * 0.5 + 0.5)) * height + canvasPos.y;
            vertices4.push(new float2(originScreenX4, originScreenY4));

            angle += inc;
        }
        angle = -Math.PI;

        for (let i = 0; i <= 36; i++)
        {
            let v3 = new float4(7 * scaleWidth, Math.cos(angle) + scaleWidth * Math.tan(alpha) * Math.cos(angle), Math.sin(angle) * eccentricity, 1);
            let result3 = mul(v3, viewProjection);
            const originScreenX3 = ((result3.x / result3.w) * 0.5 + 0.5) * width + canvasPos.x;
            const originScreenY3 = (1 - (((result3.y / result3.w)) * 0.5 + 0.5)) * height + canvasPos.y;
            vertices4.push(new float2(originScreenX3, originScreenY3));
            angle += Math.abs(inc);
        }

        const p0 = new float3(6 * scaleWidth, hairHeight , 0);
        const p1 = new float3(6 * scaleWidth, -hairHeight, 0);
        const p0_p = projectPointToScreen(p0, width, height, viewProjection);
        const p1_p = projectPointToScreen(p1, width, height, viewProjection);

        drawLine2D(p0_p, p1_p, 2, "rgb(255 255 255 / 100%)");

        ctx.beginPath();
        ctx.moveTo(p0_p.x, p0_p.y);
        ctx.fillStyle = `rgb(180 180 180 / 50%)`;
        // ctx.fillStyle = `rgb(128 128 128 / 50%)`;
        for (let i = 0; i <= 36; i++)
        {
            const p = vertices4[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgb(46 28 22 / 100%)`;

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vertices4[0].x, vertices4[0].y);
        for(let k = 1; k < vertices4.length; ++k)
        {
            ctx.lineTo(vertices4[k].x, vertices4[k].y);
        }
        ctx.fill();

    }

    {
        let inc = -Math.PI / 36;
        let angle = 0.0;
        let vertices4 = [];

        for (let i = 0; i <= 36; i++)
        {
            let v4 = new float4(7 * scaleWidth, Math.cos(angle) , Math.sin(angle) * eccentricity, 1);
            let result4 = mul(v4, viewProjection);
            const originScreenX4 = ((result4.x / result4.w) * 0.5 + 0.5) * width;
            const originScreenY4 = (1 - (((result4.y / result4.w)) * 0.5 + 0.5)) * height;
            vertices4.push(new float2(originScreenX4, originScreenY4));

            angle += inc;
        }
        angle = -Math.PI;

        for (let i = 0; i <= 36; i++)
        {
            let v3 = new float4(8 * scaleWidth, Math.cos(angle) + scaleWidth * Math.tan(alpha) * Math.cos(angle), Math.sin(angle) * eccentricity, 1);
            let result3 = mul(v3, viewProjection);
            const originScreenX3 = ((result3.x / result3.w) * 0.5 + 0.5) * width;
            const originScreenY3 = (1 - (((result3.y / result3.w)) * 0.5 + 0.5)) * height;
            vertices4.push(new float2(originScreenX3, originScreenY3));
            angle += Math.abs(inc);
        }

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vertices4[0].x, vertices4[0].y);
        for(let k = 1; k < vertices4.length; ++k)
        {
            ctx.lineTo(vertices4[k].x, vertices4[k].y);
        }
        ctx.fill();
    }

    {
        let inc = -Math.PI / 36;
        let angle = 0.0;
        let vertices4 = [];

        for (let i = 0; i <= 36; i++)
        {
            let v4 = new float4(8 * scaleWidth, Math.cos(angle) , Math.sin(angle) * eccentricity, 1);
            let result4 = mul(v4, viewProjection);
            const originScreenX4 = ((result4.x / result4.w) * 0.5 + 0.5) * width;
            const originScreenY4 = (1 - (((result4.y / result4.w)) * 0.5 + 0.5)) * height;
            vertices4.push(new float2(originScreenX4, originScreenY4));

            angle += inc;
        }
        angle = -Math.PI;

        for (let i = 0; i <= 36; i++)
        {
            let v3 = new float4(9 * scaleWidth, Math.cos(angle) + scaleWidth * Math.tan(alpha) * Math.cos(angle), Math.sin(angle) * eccentricity, 1);
            let result3 = mul(v3, viewProjection);
            const originScreenX3 = ((result3.x / result3.w) * 0.5 + 0.5) * width;
            const originScreenY3 = (1 - (((result3.y / result3.w)) * 0.5 + 0.5)) * height;
            vertices4.push(new float2(originScreenX3, originScreenY3));
            angle += Math.abs(inc);
        }

        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(vertices4[0].x, vertices4[0].y);
        for(let k = 1; k < vertices4.length; ++k)
        {
            ctx.lineTo(vertices4[k].x, vertices4[k].y);
        }
        ctx.fill();
    }



    // for(const lineSegment of lineSegments)
    // {
        // drawLine(new float3(lineSegment.a), new float3(lineSegment.b), camera);
    // }

    function intersectScene(ray, tMin, tMax)
    {
        let t = Infinity;
        let closestIntersection = null;
        for(const lineSegment of lineSegments)
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

    // drawLine(new float3(ray.origin), new float3(ray.origin.add(ray.direction)), camera);
    // drawLine(new float3(lineSegment.a), new float3(lineSegment.b), camera);
    // drawLine(new float3(lineSegment1.a), new float3(lineSegment1.b), camera);
    // ctx.strokeStyle = "red";
    // drawLine(new float3(lineSegment2.a), new float3(lineSegment2.b), camera);
    // drawLine(new float3(lineSegment3.a), new float3(lineSegment3.b), camera);
    // drawLine2D(ray.origin, ray.origin.add(ray.direction));
    // drawLine2D(lineSegment.a, lineSegment.b);

    // const intersection = lineSegment.intersect(ray, 0, 100);
    const intersection = intersectScene(ray, 0, 100);
    if(intersection !== null && intersection.hit)
    {
        const p = projectPointToScreen(intersection.position, width, height, viewProjection);
        const p1 = projectPointToScreen(intersection.position.sub(wi), width, height, viewProjection);

        drawLineArrow2D(p, p1, 2);
        drawText(p1.add(normalize(p1.sub(p)).mul(8)), "wi", "white", "16px monospace", "center");
        // drawCircle(p, 5);
        ctx.strokeStyle = "green";
        // drawLine(new float3(intersection.position), new float3(intersection.position.add(intersection.normal)), camera);
        const R = reflect(ray.direction.neg(), intersection.normal);

        ctx.strokeStyle = "yellow";
        drawLine(new float3(intersection.position), new float3(intersection.position.add(R)), camera);
        drawLineArrow(new float3(intersection.position), new float3(intersection.position.add(R)), 2, "red");

        const p2 = projectPointToScreen(new float3(intersection.position.add(R)), width, height, viewProjection);
        drawText(p2.add(normalize(p2.sub(p)).mul(16)), "R", "red", "16px monospace", "center");
        drawText(p2.add(normalize(p2.sub(p)).mul(20)).add(new float2(0, 16)), "(Primary)", "red", "11px monospace", "center");
        if(r !== null)
        {
            ctx.setLineDash([5, 8]);
            // drawLine(new float3(intersection.position), new float3(intersection.position.add(r)), camera);
            drawLineArrow(new float3(intersection.position), new float3(intersection.position.add(r)), 2, "red");
            ctx.setLineDash([]);
        }

        
        const Rt = refract(ray.direction, intersection.normal, 1 / ior);
        ctx.strokeStyle = "purple";
        drawLine(new float3(intersection.position), new float3(intersection.position.add(Rt)), camera);

        const ray1 = new Ray(intersection.position.add(normalize(intersection.normal).mul(-0.01)), Rt.mul(100));
        // const intersection1 = lineSegment1.intersect(ray1, 0, 100);
        const intersection1 = intersectScene(ray1, 0, 100);

        if(intersection1 !== null && intersection1.hit)
        {
            const p1 = projectPointToScreen(intersection1.position, width, height, viewProjection);
            // drawCircle(p1, 5);
            
            ctx.strokeStyle = "white";
            drawLine(new float3(intersection.position), new float3(intersection1.position), camera);

            ctx.strokeStyle = "green";
            // drawLine(new float3(intersection1.position), new float3(intersection1.position.add(intersection1.normal)), camera);

            const R1 = reflect(normalize(ray1.direction.neg()), intersection1.normal);
            ctx.strokeStyle = "yellow";
            // drawLine(new float3(intersection1.position), new float3(intersection1.position.add(R1)), camera);
    
            const Rt1 = refract(normalize(ray1.direction), intersection1.normal, ior);
            ctx.strokeStyle = "purple";
            // drawLine(new float3(intersection1.position), new float3(intersection1.position.add(Rt1)), camera);
            drawLineArrow(new float3(intersection1.position), new float3(intersection1.position.add(Rt1)), 2, "rgb(0 255 0)");

            if(tt !== null)
            {
                ctx.setLineDash([5, 8]);
                // drawLine(new float3(intersection1.position), new float3(intersection1.position.add(tt)), camera);
                drawLineArrow(new float3(intersection1.position), new float3(intersection1.position.add(tt)), 2, "rgb(0 255 0)");
                ctx.setLineDash([]);
            }

            let p3 = projectPointToScreen(new float3(intersection1.position.add(Rt1.mul(1.2))), width, height, viewProjection);
            drawText(p3, "TT", "rgb(0 255 0)", "16px monospace", "center");
            drawText(p3.add(new float2(0, 10)), "(Transmission)", "rgb(0 255 0)", "11px monospace", "center");

            const ray2 = new Ray(intersection1.position.add(normalize(intersection1.normal).mul(0.01)), R1.mul(1000));
            const intersection2 = intersectScene(ray2, 0, 100);

            if(intersection2 !== null && intersection2.hit)
            {
                const p1 = projectPointToScreen(intersection2.position, width, height, viewProjection);
                // drawCircle(p1, 5);
                ctx.strokeStyle = "green";
                // drawLine(new float3(intersection2.position), new float3(intersection2.position.add(intersection2.normal)), camera);

                ctx.strokeStyle = "white";
                drawLine(new float3(intersection1.position), new float3(intersection2.position), camera);
    
    
                const R2 = reflect(normalize(ray2.direction.neg()), intersection2.normal);
                ctx.strokeStyle = "yellow";
                // drawLine(new float3(intersection2.position), new float3(intersection2.position.add(R2)), camera);
        
                const Rt2 = refract(normalize(ray2.direction), intersection2.normal.neg(), ior);
                ctx.strokeStyle = "purple";
                // drawLine(new float3(intersection2.position), new float3(intersection2.position.add(Rt2)), camera);
                drawLineArrow(new float3(intersection2.position), new float3(intersection2.position.add(Rt2)), 2, "rgb(0 128 255)");
                if(trt !== null)
                {
                    ctx.setLineDash([5, 8]);
                    // drawLine(new float3(intersection2.position), new float3(intersection2.position.add(trt)), camera);
                    drawLineArrow(new float3(intersection2.position), new float3(intersection2.position.add(trt)), 2, "rgb(0 128 255)");
                    ctx.setLineDash([]);
                }
                let p4 = projectPointToScreen(new float3(intersection2.position.add(Rt2)), width, height, viewProjection);
                // p4 = p4.add(new float2(0, 16));
                drawText(p4.add(new float2(0, -16)), "TRT", "rgb(0 128 255)", "16px monospace", "center");
                drawText(p4.add(new float2(0, -4)), "(Secondary)", "rgb(0 128 255)", "11px monospace", "center");
    
            }
            
        }
    }

    {
        let inc = - Math.PI / 36;
        let angle = 0.0;
        let vertices = [];
        let vertices1 = [];
        let vertices2 = [];
        let vertices3 = [];
        let vertices4 = [];
        for (let i = 0; i <= 36; i++)
        {
            let v = new float4(0, Math.cos(angle) , Math.sin(angle) * eccentricity, 1);

            let result = mul(v, viewProjection);
            const originScreenX = ((result.x / result.w) * 0.5 + 0.5) * width;
            const originScreenY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height;
            vertices.push(new float2(originScreenX, originScreenY));

            let v1 = new float4(9 * scaleWidth, Math.cos(angle) + scaleWidth * Math.tan(alpha) * Math.cos(angle), Math.sin(angle)* eccentricity, 1);

            let result1 = mul(v1, viewProjection);
            const originScreenX1 = ((result1.x / result1.w) * 0.5 + 0.5) * width;
            const originScreenY1 = (1 - (((result1.y / result1.w)) * 0.5 + 0.5)) * height;
            vertices1.push(new float2(originScreenX1, originScreenY1));

            let v2 = new float4(8 * scaleWidth, Math.cos(angle) + scaleWidth * Math.tan(alpha) * Math.cos(angle), Math.sin(angle) * eccentricity, 1);
            let result2 = mul(v2, viewProjection);
            const originScreenX2 = ((result2.x / result2.w) * 0.5 + 0.5) * width;
            const originScreenY2 = (1 - (((result2.y / result2.w)) * 0.5 + 0.5)) * height;
            vertices2.push(new float2(originScreenX2, originScreenY2));

            let v3 = new float4(7 * scaleWidth, Math.cos(angle) + scaleWidth * Math.tan(alpha) * Math.cos(angle), Math.sin(angle) * eccentricity, 1);
            let result3 = mul(v3, viewProjection);
            const originScreenX3 = ((result3.x / result3.w) * 0.5 + 0.5) * width;
            const originScreenY3 = (1 - (((result3.y / result3.w)) * 0.5 + 0.5)) * height;
            vertices3.push(new float2(originScreenX3, originScreenY3));

            let v4 = new float4(6 * scaleWidth, Math.cos(angle), Math.sin(angle) * eccentricity, 1);
            let result4 = mul(v4, viewProjection);
            const originScreenX4 = ((result4.x / result4.w) * 0.5 + 0.5) * width;
            const originScreenY4 = (1 - (((result4.y / result4.w)) * 0.5 + 0.5)) * height;
            vertices4.push(new float2(originScreenX4, originScreenY4));

            // let v1 = new float3(Math.cos(angle), Math.sin(angle), 0);
            // vertices1.push(projectPointToScreen(v1, width, height, mul(lookAtView, viewProjection)));

            angle += inc;
        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgb(255 255 255 / 100%)`;

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for(let k = 1; k < vertices.length; ++k)
        {
            ctx.lineTo(vertices[k].x, vertices[k].y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        ctx.lineTo(vertices[vertices.length -1].x, vertices[vertices.length - 1].y);
        ctx.stroke();



        ctx.beginPath();
        ctx.fillStyle = `rgb(46 28 22 / 75%)`;
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for(let k = 1; k < vertices.length; ++k)
        {
            ctx.lineTo(vertices[k].x, vertices[k].y);
        }
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(vertices1[0].x, vertices1[0].y);
        for(let k = 1; k < vertices1.length; ++k)
        {
            ctx.lineTo(vertices1[k].x, vertices1[k].y);
        }
        ctx.stroke();

        // interior lines
        if(alpha != 0)
        {
            ctx.beginPath();
            ctx.moveTo(vertices2[0].x, vertices2[0].y);
            for(let k = 1; k < vertices2.length; ++k)
            {
                ctx.lineTo(vertices2[k].x, vertices2[k].y);
            }
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(vertices3[0].x, vertices3[0].y);
            for(let k = 1; k < vertices3.length; ++k)
            {
                ctx.lineTo(vertices3[k].x, vertices3[k].y);
            }
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(vertices4[0].x, vertices4[0].y);
        for(let k = 1; k < vertices4.length; ++k)
        {
            ctx.lineTo(vertices4[k].x, vertices4[k].y);
        }
        ctx.stroke();

    }
    


    // draw normal
    {
        const lineSegment7 = new LineSegment(new float2(7 * scaleWidth, hairHeight), new float2((7 + 1) * scaleWidth, hairHeight + scaleWidth * Math.tan(alpha)));
        let v = normalize(lineSegment7.b.sub(lineSegment7.a));
        let normal = new float2(-v.y, v.x);
        // normal when alpha is 0
        let normal1 = new float2(0, 1);
        let midpoint = lineSegment7.a.add(lineSegment7.b).mul(0.5);
        let p0 = projectPointToScreen(new float3(midpoint), width, height, viewProjection); 
        let p1 = projectPointToScreen(new float3(midpoint.add(normal)), width, height, viewProjection); 
        let p2 = projectPointToScreen(new float3(midpoint.add(normal1)), width, height, viewProjection); 
        drawLineArrow2D(p0, p1, 2, "yellow");
        drawLineArrow2D(p0, p2, 2, "yellow", [5, 8]);
        drawText(p1.add(normalize(p1.sub(p0)).mul(8)), "N", "yellow", "16px monospace", "center");

        let n = p2.sub(p0);
        n = new float2(-n.y, n.x);
        let offset = normalize(n).mul(16);
        drawText(p2.add(p0).mul(0.5).add(offset), `α = ${alphaPicker.value}°`, "yellow", "16px monospace", "left");
    }

    // draw text elements
    {
        let p00 = new float3(3.5, -1.5, 0);
        let p01 = new float3(4.5, -1.5, 0);
        let p00_t = projectPointToScreen(p00, width, height, viewProjection);
        let p01_t = projectPointToScreen(p01, width, height, viewProjection);
        
        let p02 = new float3(3.75, -1.5, 0);
        let p02_t = projectPointToScreen(p02, width, height, viewProjection);

        drawText(p00_t, "tip", undefined, "16px monospace", "center");
        drawLineArrow2D(new float2(p02_t.x, p02_t.y - 4), new float2(p01_t.x, p01_t.y - 4), 3)

        let p10 = new float3(3, -1.5, 0);
        let p11 = new float3(2, -1.5, 0);
        let p10_t = projectPointToScreen(p10, width, height, viewProjection);
        let p11_t = projectPointToScreen(p11, width, height, viewProjection);

        let p12 = new float3(2.75, -1.5, 0);
        let p12_t = projectPointToScreen(p12, width, height, viewProjection);

        drawText(p10_t, "root", undefined, "16px monospace", "center");
        drawLineArrow2D(new float2(p12_t.x, p12_t.y - 4), new float2(p11_t.x, p11_t.y - 4), 3)

        let p20 = new float3(1.6, 0, 0);
        let p20_t = projectPointToScreen(p20, width, height, viewProjection);
        drawText(p20_t, "absorption", undefined, "16px monospace")
        drawText(new float2(p20_t.x, p20_t.y + 16), "medium σ", undefined, "16px monospace")
        drawText(new float2(p20_t.x, p20_t.y + 32), `IOR η:${ior}`, undefined, "16px monospace")
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