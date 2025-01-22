import {float2, float3, float4, mat4x4, mul, dot, Camera, OrthonormalBasis, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, clamp,
    refract, negative, projectToPlane,
    project} from "./math.js"

const canvas = document.querySelector('.bravais');
let width = canvas.width =  Math.min(innerWidth, 512);
let height = canvas.height =  Math.min(innerWidth, 512);

const ctx = canvas.getContext('2d');

const thetaPicker = document.querySelector('#bravais-theta');
const phiPicker = document.querySelector('#bravais-phi');
const debugValuesCheckbox = document.querySelector('#bravais-debug-values');
const debugAlphaCheckbox = document.querySelector('#bravais-debug-alpha');
const debugThetaCheckbox = document.querySelector('#bravais-debug-theta');
const debugGammaCheckbox = document.querySelector('#bravais-debug-gamma');
const debugDeltaCheckbox = document.querySelector('#bravais-debug-delta');
const debugLengthCheckbox = document.querySelector('#bravais-debug-length');

const output = document.querySelector('.bravais-theta');
const output1 = document.querySelector('.bravais-phi');
let clearColor = "#2b2b2b";

let theta = degToRad(thetaPicker.value);
let phi = degToRad(phiPicker.value);
let showDebugValues = debugValuesCheckbox.checked;
let showAlpha = debugAlphaCheckbox.checked;
let showTheta = debugThetaCheckbox.checked;
let showGamma = debugGammaCheckbox.checked;
let showDelta = debugDeltaCheckbox.checked;
let showLength = debugLengthCheckbox.checked;

thetaPicker.addEventListener('input', () => {
    output.textContent = `${thetaPicker.value}°`;
    theta = degToRad(clamp(thetaPicker.value, -89.4, 89.4));
});

phiPicker.addEventListener('input', () => {
    output1.textContent = `${phiPicker.value}°`;
    phi = degToRad(phiPicker.value);

});

debugValuesCheckbox.addEventListener('change', ()=>
{
    showDebugValues = debugValuesCheckbox.checked;
});

debugAlphaCheckbox.addEventListener('change', ()=>
{
    showAlpha = debugAlphaCheckbox.checked;
});

debugThetaCheckbox.addEventListener('change', ()=>
{
    showTheta = debugThetaCheckbox.checked;
});

debugGammaCheckbox.addEventListener('change', ()=>
{
    showGamma = debugGammaCheckbox.checked;
});

debugDeltaCheckbox.addEventListener('change', ()=>
{
    showDelta = debugDeltaCheckbox.checked;
});

debugLengthCheckbox.addEventListener('change', ()=>
{
    showLength = debugLengthCheckbox.checked;
});

function resizeCanvas()
{
    width = canvas.width =  Math.min(innerWidth, 512);
    height = canvas.height =  Math.min(innerWidth, 512);
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
    console.log(event);
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

camera.distance = 5;

camera.rotation.x = 13;
camera.rotation.y = -35;
camera.rotation.z = 0;

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
    camera.onMouse(dx, dy, isLeftMouseDown ? 0 : (isRightMouseDown ? 1 : -1));
    camera.update(dt);
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
    
    // ctx.strokeStyle = "rgb(255 0 0)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function drawLine2D(p0, p1, lineWidth = 1, color = "white", dashed = [])
{
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.setLineDash(dashed);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
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
    const p2 = new float2(p1.x - lineWidth * 2.5 * t0.x - n0.x * lineWidth*5, p1.y - lineWidth*2.5 * t0.y - n0.y * lineWidth*5);
    const p3 = new float2(p1.x + lineWidth * 2.5 * t0.x - n0.x * lineWidth*5, p1.y + lineWidth*2.5 * t0.y - n0.y * lineWidth*5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.fill();
}

function drawText(p, text, font = "14px monospace", color = "white")
{
    ctx.font = font;
    ctx.fillStyle = color;
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

function drawArcBetweenPoints(a, b, viewProjection, radius = 0.25)
{
    const gamma = Math.acos(dot(normalize(a), normalize(b)));
    ctx.beginPath();
    ctx.setLineDash([]);
    for(let t = 0; t < 1; t += 0.1)
    {
        const p = a.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * radius).add(b.mul(Math.sin(t * gamma) / Math.sin(gamma) * radius));
        const projected = projectPointToScreen(p, width, height, viewProjection);
        if(t === 0)
        {
            ctx.moveTo(projected.x, projected.y);
            continue;
        }
        ctx.lineTo(projected.x, projected.y);
    }
    ctx.stroke();
}

function drawArrowHead(p0, p1, lineWidth = 1, color = "white", dashed = [])
{
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

function drawArcBetweenPointsArrow(a, b, viewProjection, radius = 0.15)
{
    const gamma = Math.acos(dot(normalize(a), normalize(b)));
    ctx.beginPath();
    ctx.setLineDash([]);
    for(let t = 0; t < 1; t += 0.1)
    {
        const p = a.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * radius).add(b.mul(Math.sin(t * gamma) / Math.sin(gamma) * radius));
        const projected = projectPointToScreen(p, width, height, viewProjection);
        if(t === 0)
        {
            ctx.moveTo(projected.x, projected.y);
            continue;
        }
        ctx.lineTo(projected.x, projected.y);
    }
    ctx.stroke();
    {
        let t = 0.9;
        const p = b.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * radius).add(a.mul(Math.sin(t * gamma) / Math.sin(gamma) * radius));
        t = 1;
        const p1 = b.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * radius).add(a.mul(Math.sin(t * gamma) / Math.sin(gamma) * radius));
        drawArrowHead(projectPointToScreen(p, width, height, viewProjection), projectPointToScreen(p1, width, height, viewProjection), 2);
    }
}

camera.update(0);
function draw()
{
    let currentTick = performance.now();
    dt = currentTick - previousTick;
    previousTick = currentTick;
 
    update(dt);
    let rotationX = mat4x4.rotateX(rotX);
    let rotationY = mat4x4.rotateY(rotY);
    let rotationZ = mat4x4.rotateZ(rotZ);
    direction = new float3(0, 0, 1);
    let dir = new float4(direction, 0);
    rotY += degToRad(10 * dx * dt / 1000.0);    
    rotX += degToRad(10 * dy * dt / 1000.0);    
    dir = mul(dir, mul(rotationZ, mul(rotationY, rotationX)));
    // rotZ += degToRad(0.5);    
    // let view = mat4x4.lookAt(position, focus, up);
    // let view = mat4x4.lookTo(position, new float3(0, 0, -1), up);
    forward = new float3(dir.x, dir.y, dir.z).normalize();
    let rotatedZ = mul(new float4(up, 0), rotationZ);
    // up = new float3(rotatedZ.x, rotatedZ.y, rotatedZ.z).normalize();
    up = new float3(0, 1, 0);
    right = up.cross(forward).normalize();
    up = forward.cross(right);
    const rightMovement = right.mul(movementAmount.x * 5 * dt / 1000.0);
    const forwardMovement = forward.mul(movementAmount.y * 5 * dt / 1000.0);
    position = position.add(forwardMovement).add(rightMovement);
    // const projection = mat4x4.perspective(degToRad(60.0), width / height, 0.1, 1000);
    let view = mat4x4.lookTo(position, forward.neg(), up);
    view = camera.view;
    forward = camera.forward;
    up = camera.up;
    right = camera.right;
    position = camera.position;
    const projection = camera.projection;
    let viewProjection = mul(view, projection);
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, width, height);

    /*

    for(let i = 0; i < points.length; ++i)
    {
        let point = new float4(points[i], 1);
        let projected = mul(point, viewProjection);
        if(projected.w <= 0)
        {
            continue;
        }
        projected = projected.div(projected.w);
        let x = (projected.x * 0.5 + 0.5) * width;
        let y = (-projected.y * 0.5 + 0.5) * height;
        ctx.fillStyle = `rgb(255 255 255 / ${alpha}%)`;
        ctx.beginPath();
        ctx.arc(x, y, 5, degToRad(0), degToRad(360), false);
        ctx.fill();    
    }
*/
    // coordinate frame
    if(0)
    {
        ctx.strokeStyle = "red";
        drawLine(new float3(0,0,0), new float3(1,0,0), camera);

        ctx.strokeStyle = "green";
        drawLine(new float3(0,0,0), new float3(0,1,0), camera);

        ctx.strokeStyle = "blue";
        drawLine(new float3(0,0,0), new float3(0,0,1), camera);
    }

    // Draw Circle
    if(1)
    {
        let canvasPos = new float2(0, 0);
        const v = new float4(0, 0, 0, 1);
        const result = mul(v, viewProjection);
        const originScreenX = ((result.x / result.w) * 0.5 + 0.5) * width + canvasPos.x;
        const originScreenY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height + canvasPos.y;
        const p1 = new float2(originScreenX, originScreenY);

        let inc = 2 * 3.14159265 / 360.;
        let angle = 0.0;
        let vertices = [];
        let vertices1 = [];
        for (let i = 0; i <= 360; i++)
        {
            let v = new float4(Math.cos(angle), 0, Math.sin(angle), 1);

            let result = mul(v, viewProjection);
            const originScreenX = ((result.x / result.w) * 0.5 + 0.5) * width + canvasPos.x;
            const originScreenY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height + canvasPos.y;
            vertices.push(new float2(originScreenX, originScreenY));

            let v1 = new float3(Math.cos(angle), Math.sin(angle), 0);
            vertices1.push(projectPointToScreen(v1, width, height, viewProjection));

            angle += inc;
        }

        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(255 255 255 / 50%)`;

        // ctx.beginPath();
        // ctx.moveTo(vertices[0].x, vertices[0].y);
        // for(let k = 1; k < vertices.length; ++k)
        // {
        //     ctx.lineTo(vertices[k].x, vertices[k].y);
        // }
        // ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(vertices1[0].x, vertices1[0].y);
        for(let k = 1; k < vertices1.length; ++k)
        {
            ctx.lineTo(vertices1[k].x, vertices1[k].y);
        }
        ctx.stroke();
    }

    // draw coordinate frame
    {
        const p0 = new float3(0, 0, 0);
        const p1 = new float3(1, 0, 0);
        const p2 = new float3(0, 1, 0);
        const p3 = new float3(0, 0, 1);
        const p4 = new float3(0,-1, 0);
        
        const s0 = projectPointToScreen(p0, width, height, viewProjection);
        const s1 = projectPointToScreen(p1, width, height, viewProjection);
        const s2 = projectPointToScreen(p2, width, height, viewProjection);
        const s3 = projectPointToScreen(p3, width, height, viewProjection);
        const s4 = projectPointToScreen(p4, width, height, viewProjection);

        // ctx.lineWidth = 3;
        // ctx.strokeStyle = "white";
        // ctx.beginPath();
        // ctx.moveTo(s0.x, s0.y);
        // ctx.lineTo(s2.x, s2.y);
        // ctx.stroke();
        drawLineArrow2D(s0, s2, 3, "rgb(0 100 255 / 100%)");
        
        ctx.save();
        ctx.textAlign = "center";
        // drawText(new float2(s2.x, s2.y - 16), "n")
        drawText(new float2(s2.x, s2.y - 8), "n", "bold 24px monospace", "rgb(0 100 255)");
        ctx.restore();

        // drawCircle(s2, 4);
        drawLine2D(s0, s4, 2);
    }

    // draw normal plane
    {
        const p0 = new float3(-1, -1, 0);
        const p1 = new float3( 1, -1, 0);
        const p2 = new float3( 1,  1, 0);
        const p3 = new float3(-1,  1, 0);

        const s0 = projectPointToScreen(p0, width, height, viewProjection);
        const s1 = projectPointToScreen(p1, width, height, viewProjection);
        const s2 = projectPointToScreen(p2, width, height, viewProjection);
        const s3 = projectPointToScreen(p3, width, height, viewProjection);
        
        ctx.strokeStyle = `rgb(255 255 255 / 50%)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s2.x, s2.y);
        ctx.lineTo(s3.x, s3.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s3.x, s3.y);
        ctx.stroke();
    }

    // draw horizontal normal plane
    {
        const p0 = new float3(-1, 0, -1);
        const p1 = new float3( 1, 0, -1);
        const p2 = new float3( 1, 0,  1);
        const p3 = new float3(-1, 0,  1);

        const s0 = projectPointToScreen(p0, width, height, viewProjection);
        const s1 = projectPointToScreen(p1, width, height, viewProjection);
        const s2 = projectPointToScreen(p2, width, height, viewProjection);
        const s3 = projectPointToScreen(p3, width, height, viewProjection);

        ctx.strokeStyle = `rgb(255 255 255 / 50%)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.lineTo(s3.x, s3.y);
        ctx.lineTo(s0.x, s0.y);
        ctx.stroke();

        const p4 = new float3(-1,  0,  0);
        const p5 = new float3( 1,  0,  0);
        const p6 = new float3( 0,  0, -1);
        const p7 = new float3( 0,  0,  1);

        const s4 = projectPointToScreen(p4, width, height, viewProjection);
        const s5 = projectPointToScreen(p5, width, height, viewProjection);
        const s6 = projectPointToScreen(p6, width, height, viewProjection);
        const s7 = projectPointToScreen(p7, width, height, viewProjection);

        // draw center lines
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s4.x, s4.y);
        ctx.lineTo(s5.x, s5.y);
        ctx.stroke();
        ctx.moveTo(s6.x, s6.y);
        ctx.lineTo(s7.x, s7.y);
        ctx.stroke();
    }

    const cylinder = new Cylinder(new float3(0, 0, 0), 1, 1000);
    const plane = new Plane(new float3(0, 0, 0), new float3(0, 1, 0));
    const origin = new float3(0,0,0);
    const sinTheta = Math.sin(theta + Math.PI / 2);
    const cosTheta = Math.cos(theta + Math.PI / 2);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const wi = normalize(new float3(sinTheta * cosPhi, sinTheta * sinPhi, cosTheta));
    drawLine2D(projectPointToScreen(new float3(0, 0, 0), width, height, viewProjection), projectPointToScreen(new float3(0, wi.y, 0), width, height, viewProjection), 2);

    const ray = new Ray(wi, wi.neg());
    // const result = cylinder.intersect(ray, 0, 10000);
    const result = plane.intersect(ray);
    if(result.hit)
    {
        const hairIOR = 1.55;
        const airIOR = 1.0;
        const eta = airIOR / hairIOR;
        const wr = refract(wi.neg(), result.normal, eta);
        {
            const p0 = projectPointToScreen(cylinder.center, width, height, viewProjection);
            const p1 = projectPointToScreen(negative(result.normal), width, height, viewProjection);
            const p2 = projectPointToScreen(result.normal, width, height, viewProjection);
            const p3 = projectPointToScreen(wi, width, height, viewProjection);
            const p4 = projectPointToScreen(wr, width, height, viewProjection);

            ctx.textAlign = "center";
            // drawLine2D(p0, p3, 3);
            drawLineArrow2D(p0, p3, 2);
            let text = "ωi";
            const metrics = ctx.measureText(text);
            // drawText(new float2(p3.x - metrics.width, p3.y - (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * 0.5), text);
            drawText(new float2(p3.x, p3.y - 8), text);
            // drawLine2D(p0, p4, 3);
            drawLineArrow2D(p0, p4, 2);
            drawCircle(p3, 4);
            const hi_1 = projectToPlane(wi, result.normal);
            const p5 = projectPointToScreen(hi_1, width, height, viewProjection);
            drawLine2D(p3, p5, 2);

            const s_i_ss = projectPointToScreen(hi_1.add(cylinder.center).mul(0.5), width, height, viewProjection);
            // ctx.save();
            // ctx.textAlign = "center";
            // drawText(new float2(s_i_ss.x, s_i_ss.y - 8), "s_i");
            // ctx.restore();

            const s_i_ss_v = (new float2(p5.x - p0.x, p5.y - p0.y)).normalize();
            let s_i_angle = Math.atan2(s_i_ss_v.y, s_i_ss_v.x);
            if (s_i_angle > Math.PI / 2)
            {
                s_i_angle -=  Math.PI;
            }
            else if (s_i_angle < -Math.PI / 2)
            {
                s_i_angle += Math.PI;
            }
            
            if(showLength)
            {
                ctx.save();
                ctx.textAlign = "center";
                ctx.translate(s_i_ss.x, s_i_ss.y);
                ctx.rotate(s_i_angle);
                drawText(new float2(0, 10), "si");
                ctx.restore();
            }

            // project the refracted vector up towards the plane
            const ht_2 = projectToPlane(wr, result.normal);
            const p6 = projectPointToScreen(ht_2, width, height, viewProjection);
            drawLine2D(p4, p6, 2);
            ctx.textAlign = "left";
            const offsetV = normalize(p4.sub(p0));

            drawText(new float2(p4.x + offsetV.x * 16, p4.y + offsetV.y * 16), "s(η,ωi)");
            drawCircle(p4, 4, `rgb(255 255 255)`);
            // draw refracted vector to normal axis
            // drawLine2D(p6, projectPointToScreen(new float3(0, ht_2.y, 0), width, height, viewProjection), 5, "red");
            drawLine2D(p6, p0, 1.5);

            const s_i_n_ss = projectPointToScreen(ht_2.add(cylinder.center).mul(0.5), width, height, viewProjection);
            ctx.textAlign = "center";

            if(showLength)
            {
                // const sinDeltaVector = (new float2(p6.x - p0.x, p6.y - p0.y)).normalize();
                const sinDeltaVector = (new float2(p6.x - s_i_n_ss.x, p6.y - s_i_n_ss.y)).normalize();
                let sinDeltaAngle = Math.atan2(sinDeltaVector.y, sinDeltaVector.x);
                ctx.save();
                ctx.translate(s_i_n_ss.x, s_i_n_ss.y);
                ctx.rotate(sinDeltaAngle);
                drawText(new float2(0, -8), "si/η");
                ctx.restore();
            }
            const ht_3_ss = projectPointToScreen(new float3(0, wr.y, 0), width, height, viewProjection);
            drawLine2D(p4, ht_3_ss, 2);

            // draw projection of wi to normal plane (azimuthal)
            const planeNormal = new float3(0, 0, 1);
            const wi_projected = projectToPlane(wi, planeNormal);
            const wi_h_projected = projectToPlane(wi, result.normal);
            const wi_h_projected_ss = projectPointToScreen(wi_h_projected, width, height, viewProjection);

            // const wi_projected = new float3(wi.x, wi.y, 0);

            const wi_projected_ss = projectPointToScreen(wi_projected, width, height, viewProjection);
            drawLine2D(p0, wi_projected_ss, 3);
            drawText(new float2(wi_projected_ss.x, wi_projected_ss.y - 8), "ωi'");
            drawCircle(wi_projected_ss, 4);
            // from wi to wi projected to normal plane
            drawLine2D(p3, wi_projected_ss, 2, "white", [8, 5]);

            const sinThetaI = Math.sin(theta);
            const cosThetaI = Math.cos(theta);
            const phi = Math.atan2(wi.y, wi.x);
            const gamma = Math.acos(dot(normalize(wi), normalize(wi_projected)));
            const sinGamma = Math.sin(gamma);
            const cosGamma = Math.cos(gamma);

            // draw angle γ
            if(showGamma)
            {
                drawArcBetweenPoints(wi, wi_projected, viewProjection);
                const angleTextPosition = wi.mul(0.25).add(wi_projected.mul(0.25)).mul(0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                const offset = normalize(angleTextPosition_ss.sub(p0));
                ctx.save();
                ctx.textAlign = "right";
                drawText(new float2(angleTextPosition_ss.x + offset.x * 14, angleTextPosition_ss.y + offset.y * 14),  "γ");
                ctx.restore();
            }

            // draw the refracted vector using the modified index of refraction
            const etaP = Math.sqrt(hairIOR * hairIOR - sinGamma * sinGamma) / cosGamma;
            const wt_v = refract(normalize(wi_projected).neg(), result.normal, airIOR / etaP);
            const wt_p = projectPointToScreen(wt_v, width, height, viewProjection);
            drawLine2D(p0, wt_p, 2);
            ctx.save();
            ctx.textAlign = (theta < 0) ? "left" : "right";
            drawText(new float2(wt_p.x - ((theta < 0) ? -8 : 8), wt_p.y + 8), "s(η',ωi')");
            drawCircle(wt_p, 4, `rgb(255 255 255)`);

            const wtt_projected = projectToPlane(wr, planeNormal);
            const wtt_p = projectPointToScreen(wtt_projected, width, height, viewProjection);
            drawLine2D(p0, wtt_p, 2);

            const wr_h_projected = projectToPlane(wr, result.normal);

            // draw angle theta_i
            if(showTheta)
            {
                drawArcBetweenPoints(normalize(wi), normalize(result.normal), viewProjection);
                const angleTextPosition = wi.mul(0.25).add(result.normal.mul(0.25)).mul(0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                const offset = normalize(angleTextPosition_ss.sub(p0));
                ctx.save();
                ctx.textAlign = "right";
                drawText(new float2(angleTextPosition_ss.x + offset.x * 14, angleTextPosition_ss.y + offset.y * 14) ,  "θ");
                ctx.restore();
            }

            // draw angle alpha_i
            if(showAlpha)
            {
                drawArcBetweenPoints(normalize(wi), normalize(wi_h_projected), viewProjection);
                const angleTextPosition = wi.mul(0.25).add(wi_h_projected.mul(0.25)).mul(0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                const offset = normalize(angleTextPosition_ss.sub(p0));
                ctx.save();
                ctx.textAlign = "center";
                drawText(new float2(angleTextPosition_ss.x + offset.x * 14, angleTextPosition_ss.y + offset.y * 14) ,  "α");
                ctx.restore();
            }

            // project to horizontal plane
            const wi_0 = normalize(new float3(wi.x, 0, 0));

            // draw angle alpha_i'
            if(showAlpha)
            {
                // drawArcBetweenPoints(normalize(wi_projected), normalize(wi_0), viewProjection);
                // const angleTextPosition = normalize(wi_projected).mul(0.25).add(normalize(wi_0).mul(0.25)).mul(0.5);
                drawArcBetweenPoints(normalize(wi_projected), normalize(wi_0), viewProjection, Math.abs(wi.x) * 0.5);
                const angleTextPosition = normalize(wi_projected).mul(wi_projected.length() * 0.4).add(normalize(wi_0).mul(wi_projected.length() * 0.4)).mul(0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                const offset = normalize(angleTextPosition_ss.sub(p0));
                ctx.save();
                ctx.textAlign = "center";
                drawText(new float2(angleTextPosition_ss.x + offset.x * 14, angleTextPosition_ss.y + offset.y * 14) ,  "α'");
                ctx.restore();
            }
            

            const cosDelta = dot(normalize(wr), normalize(wtt_projected));
            const delta = Math.acos(cosDelta);
            const cosTheta1 = dot(normalize(result.normal), normalize(wi));
            const cosThetaP = dot(normalize(result.normal), normalize(wi_projected));
            const cosAlpha = dot(normalize(wi_h_projected), normalize(wi));
            const thetaP = Math.acos(cosThetaP);
            const theta1 = Math.acos(cosTheta1);
            const alpha = Math.acos(cosAlpha);
            const sinTheta1 = Math.sin(theta1);
            const sinThetaP = Math.sin(thetaP);
            const sinAlpha = Math.sin(alpha);
            const sinThetaP1 = sinTheta * cosDelta;

            const cosThetaPP = dot(normalize(wi_projected), wi_0);
            const thetaPP = Math.acos(cosThetaPP);
            const sinThetaPP = Math.sin(thetaPP);
            const sinAlphaOverCosGamma = sinAlpha / cosGamma;

            const cosAlphaT = dot(normalize(wr_h_projected), normalize(wr));
            const alphaT = Math.acos(cosAlphaT);
            const sinAlphaT = Math.sin(alphaT);
            
            
            // project to horizontal plane
            const wt_0 = normalize(new float3(wr.x, 0, 0));
            const cosAlphaTP = dot(normalize(wtt_projected), wt_0);
            const alphaTP = Math.acos(cosAlphaTP);
            const sinAlphaTP = Math.sin(alphaTP);

            const cosThetaT = dot(normalize(result.normal), normalize(wr.neg()));
            const thetaT = Math.acos(cosThetaT);
            const sinThetaT = Math.sin(thetaT);

            const sinAlphatOverCosDelta = sinAlphaT / cosDelta;

            // draw angle theta_t
            if(showTheta)
            {
                drawArcBetweenPoints(normalize(wr), normalize(result.normal), viewProjection, 0.15);
                const angleTextPosition = normalize(wr).mul(0.25).add(normalize(result.normal).mul(0.25)).mul(0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                const offset = normalize(angleTextPosition_ss.sub(p0));
                ctx.save();
                ctx.textAlign = "center";
                drawText(new float2(angleTextPosition_ss.x , angleTextPosition_ss.y ) ,  "θt");
                ctx.restore();
            }

            // draw angle alpha_t
            if(showAlpha)
            {
                drawArcBetweenPoints(normalize(wr), normalize(wr_h_projected), viewProjection, 0.15);
                const angleTextPosition = normalize(wr).mul(0.25).add(normalize(wr_h_projected).mul(0.25)).mul(0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                const offset = normalize(angleTextPosition_ss.sub(p0));
                ctx.save();
                ctx.textAlign = "center";
                drawText(new float2(angleTextPosition_ss.x , angleTextPosition_ss.y ) ,  "αt");
                ctx.restore();
            }

            // draw angle alpha_t'
            if(showAlpha)
            {
                // drawArcBetweenPoints(normalize(wtt_projected), normalize(wt_0), viewProjection, 0.15);
                // const angleTextPosition = normalize(wtt_projected).mul(0.25).add(normalize(wt_0).mul(0.25)).mul(0.5);
                drawArcBetweenPoints(normalize(wtt_projected), normalize(wt_0), viewProjection, Math.abs(wr.x) * 0.5);
                const angleTextPosition = normalize(wtt_projected).mul(wr.x * 0.75).add(wt_0.mul(wr.x * 0.75)).mul(0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                const offset = normalize(angleTextPosition_ss.sub(p0));
                ctx.save();
                ctx.textAlign = "center";
                drawText(new float2(angleTextPosition_ss.x + offset.x * 8, angleTextPosition_ss.y + offset.y * 8) ,  "αt'");
                ctx.restore();
            }
            
            {
                ctx.textAlign = "left";
                drawText(new float2(wtt_p.x - ((theta < 0) ? -8 : 8), wtt_p.y + 8), "s(η, ωi)'");
                ctx.restore();
                drawCircle(wtt_p, 4, `rgb(255 255 255)`);
                ctx.textAlign = "center";
            }
            // projected refracted vector s(η,v_i)' to refracted vector s(η,v_i)
            drawLine2D(p4, wtt_p, 2, "white", [8, 5]);

            const ht_4 = new float3(0, wtt_projected.y, 0);
            const ht_4_ss = projectPointToScreen(ht_4, width, height, viewProjection);
            drawLine2D(wtt_p, ht_4_ss, 2);

            // project projected refraction vector s(η,v_i)' up
            const wtt_projected_projected = new float3(wtt_projected.x, 0, wtt_projected.z);
            const wtt_projected_p = projectPointToScreen(wtt_projected_projected, width, height, viewProjection);
            drawLine2D(wtt_projected_p, p6, 2);
            drawLine2D(wtt_projected_p, wtt_p, 2);

            if(showLength)
            {
                const sinDeltaTextPosition = projectPointToScreen(ht_2.add(wtt_projected_projected).mul(0.5), width, height, viewProjection);
                const sinDeltaVector = (new float2(p6.x - wtt_projected_p.x, p6.y - wtt_projected_p.y)).normalize();
                let sinDeltaAngle = Math.atan2(sinDeltaVector.y, sinDeltaVector.x);
                ctx.save();
                ctx.translate(sinDeltaTextPosition.x, sinDeltaTextPosition.y);
                ctx.rotate(sinDeltaAngle);
                drawText(new float2(0, -8), "sinδ");
                ctx.restore();
            }

            // project wi down y axis
            const h_i_projected = new float3(wi_projected.x, 0, wi_projected.z);
            const h_i_projected_ss = projectPointToScreen(h_i_projected, width, height, viewProjection);
            drawLine2D(h_i_projected_ss, wi_projected_ss, 1.5);

            const sinThetaTextPosition = projectPointToScreen(hi_1.add(h_i_projected).mul(0.5), width, height, viewProjection);
            if(showLength)
            {
                ctx.save();
                const veccy = (new float2(p5.x - h_i_projected_ss.x, p5.y - h_i_projected_ss.y)).normalize();
                let angle = Math.atan2(veccy.y, veccy.x);
                if (angle > Math.PI/2)
                {
                    angle -= Math.PI ;
                }
                else if (angle < -Math.PI / 2)
                {
                    angle += Math.PI;
                }

                ctx.translate(sinThetaTextPosition.x, sinThetaTextPosition.y);
                ctx.rotate(angle);

                drawText(new float2(0, -8), "sinγ");
                ctx.restore();

            }

            // draw from project y-axis to wi projected to y_axis (h_i, 1)
            drawLine2D(h_i_projected_ss, p5, 1.5);           
            
            // draw s_i (h_i,1 to origin)
            drawLine2D(p5, p0, 1.5);

            // draw w_i to normal axis
            drawLine2D(p3, projectPointToScreen(new float3(0, wi.y, 0), width, height, viewProjection), 1.5);
            // draw w_i' to normal axis
            drawLine2D(wi_projected_ss, projectPointToScreen(new float3(0, wi_projected.y, 0), width, height, viewProjection), 1.5);

            // draw angle delta δ
            if(showDelta)
            {
                drawArcBetweenPoints(wr, wtt_projected, viewProjection);
                const angleTextPosition1 = wr.mul(0.25).add(normalize(wtt_projected).mul(0.25)).mul(0.5);
                const angleTextPosition1_ss = projectPointToScreen(angleTextPosition1, width, height, viewProjection);
                const offset = normalize(angleTextPosition1_ss.sub(p0));
                drawText(new float2(angleTextPosition1_ss.x + offset.x * 14, angleTextPosition1_ss.y + offset.y * 14), "δ");
            }

            if(showDebugValues)
            {
                
                let x = 32;
                let y = 32;
                ctx.fillStyle = "rgb(128 128 128 / 80%)";
                ctx.roundRect(x - 16, y - 16, 250, 250, [5, 5, 5, 5]);
                ctx.fill();

                ctx.textAlign = "left";
                let row = 0;
                drawText(new float2(x, y + row++ * 16), `theta   : ${theta.toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `γ   : ${gamma.toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `cosγ   : ${Math.cos(gamma).toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `||ωi'||: ${wi_projected.length().toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `cosTheta1: ${cosTheta1.toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `theta1: ${radToDeg(theta1).toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `thetaP: ${radToDeg(thetaPP).toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `sin(thetaPP): ${sinThetaPP.toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `sinAlpha / cosGamma: ${sinAlphaOverCosGamma.toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `sin(thetaTP): ${sinAlphaTP.toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `sinAlphaT / cosDelta: ${sinAlphatOverCosDelta.toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `sinThetaI: ${sinTheta1.toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `etaSinThetaT: ${(1 / eta * sinThetaT).toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `cosThetaI: ${(cosTheta1).toFixed(2)}`);
                drawText(new float2(x, y + row++ * 16), `sinThetaIP: ${(sinThetaPP * wi_projected.length()).toFixed(2)}`);

            }
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
