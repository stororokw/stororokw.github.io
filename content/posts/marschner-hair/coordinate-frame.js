import {float2, float3, float4, mat4x4, mul, dot, Camera, OrthonormalBasis, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, Sphere,
    refract, negative, projectToPlane, cross, radians, degrees, distance, length, clamp,
    project} from "./math.js"

const canvas = document.querySelector('.coordinate-frame');
// let width = canvas.width = innerWidth;
// let height = canvas.height = innerHeight;
// const width = canvas.width = canvas.getBoundingClientRect().width;
// const height = canvas.height = canvas.getBoundingClientRect().height;
// let width = canvas.width;
// let height = canvas.height;
let width = canvas.width =  Math.min(innerWidth, 512);
let height = canvas.height =  Math.min(innerWidth, 512);

let defaultLineColor = "rgb(255 255 255)";
// let defaultLineColor = "rgb(200 200 200)";

const ctx = canvas.getContext('2d');

const thetaPicker = document.querySelector('#coordinate-frame-theta');
const phiPicker = document.querySelector('#coordinate-frame-phi');

const output = document.querySelector('.coordinate-frame-theta');
const output1 = document.querySelector('.coordinate-frame-phi');
// let clearColor = "black";
let clearColor = "#2b2b2b";

let theta = degToRad(clamp(thetaPicker.value, -89.9, 89.9));
let phi = degToRad(phiPicker.value);

thetaPicker.addEventListener('input', () => {
    output.textContent = thetaPicker.value;
    theta = degToRad(clamp(thetaPicker.value, -89.9, 89.9));
});

phiPicker.addEventListener('input', () => {
    output1.textContent = phiPicker.value;
    phi = degToRad(phiPicker.value);

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
// window.addEventListener("wheel", (e) => {if(document.activeElement == canvas && e.target == canvas) e.preventDefault();}, {passive:false});

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
//     if(document.activeElement === canvas)
//         {
//     mouseWheelDeltaY = e.deltaY;
//     camera.distance += e.deltaY * 0.001;
//     camera.distance = Math.max(camera.distance, 0);
//         }
// }, {
//     passive: true
//   });

// let points = [new float3(1, -1, -1), new float3(1, -1, 1), new float3(-1, -1, 1), new float3(-1, -1, -1), new float3(1, 1, -1), new float3(1, 1, 1), new float3(-1, 1, 1), new float3(-1, 1, -1), new float3(0, 0, -1)];
let points = [];

const radius = 1;
const maxStacks = 8;
const maxSlices = 8;
for(let stacks = 0; stacks < maxStacks; ++stacks)
{
    let phi = Math.PI * (stacks + 1) / maxStacks;
    for(let j = 0; j < maxSlices; ++j)
    {
        let theta = 2 * Math.PI * j / maxSlices;
        let x = Math.sin(phi) * Math.cos(theta);
        let y = Math.cos(phi);
        let z = Math.sin(phi) * Math.sin(theta);
        points.push(new float3(x, y, z));
    }
}

let camera = new Camera(degToRad(30.0), width / height, 0.1, 1000);
camera.distance = 5;
camera.rotation.x = 15;
camera.rotation.y = -120;
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
    ctx.save();
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
    const p2 = new float2(p1.x - lineWidth * 2.5 * t0.x - n0.x * lineWidth*5, p1.y - lineWidth*2.5 * t0.y - n0.y * lineWidth*5);
    const p3 = new float2(p1.x + lineWidth * 2.5 * t0.x - n0.x * lineWidth*5, p1.y + lineWidth*2.5 * t0.y - n0.y * lineWidth*5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.fill();
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

function drawText(p, text, font = "16px monospace", color = "white", align = "left")
{
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, p.x, p.y);
}

function projectPointToScreen(point, width, height, viewProjection)
{
    const result = mul(new float4(point.x, point.y, point.z, 1), viewProjection);
    if(result.w <= 0)
    {
        return new float2(NaN, NaN);
    }
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

function drawArcBetweenPoints(a, b, viewProjection)
{
    const gamma = Math.acos(dot(normalize(a), normalize(b)));
    ctx.beginPath();
    ctx.setLineDash([]);
    for(let t = 0; t < 1; t += 0.1)
    {
        const p = a.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.25).add(b.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.25));
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
    if(0)
    {
    // ctx.fillStyle = 'rgb(0 0 0)';
    // ctx.font = "32px arial";
    ctx.textAlign = "start";
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillText(`${curX} ${curY}`, 100, 100);
    ctx.fillText(`left mouse down: ${isLeftMouseDown}`, 100, 120);
    ctx.fillText(`right mouse down: ${isRightMouseDown}`, 100, 140);
    ctx.fillText(`${keyPressed}`, 100, 160);
    ctx.fillText(`${dt.toFixed(1)} ms`, 100, 180);
    ctx.fillText(`${mouseWheelDeltaY * dt * -0.01}`, 100, 200);
    ctx.fillText(`position: ${position.x}, ${position.y}, ${position.z}`, 100, 220);
    ctx.fillText(`dx dy: ${dx}, ${dy}`, 100, 240);
    ctx.fillText(`forward: ${forward.x}, ${forward.y}, ${forward.z}`, 100, 260);
    ctx.fillText(`right: ${right.x}, ${right.y}, ${right.z}`, 100, 280);
    ctx.fillText(`up: ${up.x}, ${up.y}, ${up.z}`, 100, 300);
    ctx.fillText(`test w ${keymap["Control"]}`, 100, 320);
    ctx.fillText(`rotation: ${camera.rotation.x}, ${camera.rotation.y}, ${camera.rotation.z}`, 100, 340);
}

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
    const basis = OrthonormalBasis.fromU(new float3(0, 0, 1)); 
    basis.u = new float3(0, 0, 1);
    basis.v = new float3(0, 1, 0);
    basis.w = new float3(1, 0, 0);

    const U = cross(basis.v, basis.w);
    const V = cross(basis.w, basis.u);
    const W = cross(basis.u, basis.v);
    if(0)
    {
        ctx.strokeStyle = "red";
        drawLine(new float3(0,0,0), basis.u, camera);

        ctx.strokeStyle = "green";
        drawLine(new float3(0,0,0), basis.v, camera);

        ctx.strokeStyle = "blue";
        drawLine(new float3(0,0,0), basis.w, camera);
    }

    // Draw circle
    {
        const inc = 2 * 3.14159265 / 360.;
        let angle = 0.0;
        const vertices = [];
        const vertices1 = [];
        const vertices2 = [];
        for (let i = 0; i <= 360; i++)
        {
            const p0 = new float3(Math.cos(angle), 0, Math.sin(angle));
            vertices.push(projectPointToScreen(basis.toLocal(p0), width, height, viewProjection));

            const p2 = new float3(Math.cos(angle), Math.sin(angle), 0);
            vertices1.push(projectPointToScreen(basis.toLocal(p2), width, height, viewProjection));

            angle += inc;
        }
        ctx.lineWidth = 1.5;
        // ctx.strokeStyle = `rgb(255 255 255 / 50%)`;
        ctx.strokeStyle = defaultLineColor;
        
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
    // Draw Circle
    if(0)
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

    // Draw cylinder
    if (0)
    {
        const inc = 2 * 3.14159265 / 360.;
        let angle = -Math.PI;
        const vertices = [];

        const mStacks = 16;
        const mSectors = 8;
        const startAngle = 0;
        const endAngle = 2 * Math.PI;
        const cylinderHeight = 2;
        const sectorStep = cylinderHeight / mSectors;
        const stackStep = (endAngle - startAngle) / mStacks;
        const mRadius = 1;
        for (let j = 0; j <= mSectors; ++j)
        {
            for (let i = 0; i < mStacks; ++i)
            {
                const theta = startAngle + i * stackStep;
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);

                const x = mRadius * cosTheta;
                const y = mRadius * sinTheta;
                const z = -cylinderHeight * 0.5 + j * sectorStep;

                const position = new float3(x, y, z);
                const p1 = projectPointToScreen(basis.toLocal(position), width, height, viewProjection);
                vertices.push(p1);
                drawCircle(p1, 2, "rgb(255 255 255 / 64%");
                const cylinderNormal = normalize(new float3(cosTheta, sinTheta, 0));

                const position1 = basis.toLocal(position.add(cylinderNormal.mul(0.1)));
                const p3 = projectPointToScreen(position1, width, height, viewProjection);
                drawLine2D(p1, p3, 2, "rgb(0 255 0 / 64%)");
            }
        }
    }

    if(0)
    {
        try
        {
            const cylinderHeight = 5;

            const c4 = basis.toLocal(new float3(Math.sin(radians(0)),   Math.cos(radians(0)), 0));
            const c4_p = projectPointToScreen(c4, width, height, viewProjection);
            const d4 = basis.toLocal(new float3(Math.sin(radians(0)),    Math.cos(radians(0)),    -cylinderHeight ));
            const d4_p = projectPointToScreen(d4, width, height, viewProjection);

            let grad4= ctx.createLinearGradient(c4_p.x, c4_p.y, d4_p.x, d4_p.y);
            grad4.addColorStop(0, "rgb(255 255 255 / 50%)");
            grad4.addColorStop(1, "rgb(255 255 255 / 0%)");

            drawLine2D(c4_p, d4_p, 2, grad4);

            const c3 = basis.toLocal(new float3(Math.sin(radians(135)),   Math.cos(radians(135)), 0));
            const c3_p = projectPointToScreen(c3, width, height, viewProjection);
            const d3 = basis.toLocal(new float3(Math.sin(radians(135)),    Math.cos(radians(135)),    -cylinderHeight ));
            const d3_p = projectPointToScreen(d3, width, height, viewProjection);
            let grad3= ctx.createLinearGradient(c3_p.x, c3_p.y, d3_p.x, d3_p.y);
            grad3.addColorStop(0, "rgb(255 255 255 / 50%)");
            grad3.addColorStop(1, "rgb(255 255 255 / 0%)");
            // console.log(Math.atan2(camera.forward.y, camera.forward.x));
            drawLine2D(c3_p, d3_p, 2, grad3);

            const c2 = basis.toLocal(new float3(Math.sin(radians(-135)),   Math.cos(radians(-135)), 0));
            const c2_p = projectPointToScreen(c2, width, height, viewProjection);
            const d2 = basis.toLocal(new float3(Math.sin(radians(-135)),    Math.cos(radians(-135)),    -cylinderHeight ));
            const d2_p = projectPointToScreen(d2, width, height, viewProjection);
            let grad2= ctx.createLinearGradient(c2_p.x, c2_p.y, d2_p.x, d2_p.y);
            grad2.addColorStop(0, "rgb(255 255 255 / 50%)");
            grad2.addColorStop(1, "rgb(255 255 255 / 0%)");
            // console.log(Math.atan2(camera.forward.y, camera.forward.x));
            drawLine2D(c2_p, d2_p, 2, grad2);

            
            const inc = 2 * 3.14159265 / 360.;
            let angle = 0.0;
            const vertices = [];
            const vertices1 = [];
            const vertices2 = [];
            for (let i = 0; i <= 360; i++)
            {
                const p0 = new float3(Math.cos(angle), 0, Math.sin(angle));
                vertices.push(projectPointToScreen(basis.toLocal(p0), width, height, viewProjection));

                const p2 = new float3(Math.cos(angle), Math.sin(angle), 0);
                vertices1.push(projectPointToScreen(basis.toLocal(p2), width, height, viewProjection));

                angle += inc;
            }
            
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.moveTo(vertices1[0].x, vertices1[0].y);
            for(let k = 1; k < vertices1.length; ++k)
            {
                ctx.lineTo(vertices1[k].x, vertices1[k].y);
            }
            ctx.fill();
        } catch(error)
        {

        }
    }



    // draw normal plane
    if(1)
    {
        const p0 = basis.toLocal(new float3(-1, -1, 0));
        const p1 = basis.toLocal(new float3( 1, -1, 0));
        const p2 = basis.toLocal(new float3( 1,  1, 0));
        const p3 = basis.toLocal(new float3(-1,  1, 0));

        const s0 = projectPointToScreen(p0, width, height, viewProjection);
        const s1 = projectPointToScreen(p1, width, height, viewProjection);
        const s2 = projectPointToScreen(p2, width, height, viewProjection);
        const s3 = projectPointToScreen(p3, width, height, viewProjection);
        
        // ctx.strokeStyle = `rgb(255 255 255 / 50%)`;
        ctx.strokeStyle = defaultLineColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.lineTo(s3.x, s3.y);
        ctx.closePath();
        ctx.stroke();

        const p4 = basis.toLocal(new float3(-1,  0,  0));
        const p5 = basis.toLocal(new float3( 1,  0,  0));
        const p6 = basis.toLocal(new float3( 0, -1,  0));
        const p7 = basis.toLocal(new float3( 0,  1,  0));

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

    // draw horizontal normal plane
    if(1)
    {
        const p0 = basis.toLocal(new float3(-1, 0, -1));
        const p1 = basis.toLocal(new float3( 1, 0, -1));
        const p2 = basis.toLocal(new float3( 1, 0,  1));
        const p3 = basis.toLocal(new float3(-1, 0,  1));

        const s0 = projectPointToScreen(p0, width, height, viewProjection);
        const s1 = projectPointToScreen(p1, width, height, viewProjection);
        const s2 = projectPointToScreen(p2, width, height, viewProjection);
        const s3 = projectPointToScreen(p3, width, height, viewProjection);

        ctx.strokeStyle = `rgb(255 255 255 / 50%)`;
        // ctx.strokeStyle = defaultLineColor;
        ctx.lineWidth = 1.5;
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
        ctx.strokeStyle = defaultLineColor;
        ctx.beginPath();
        ctx.moveTo(s4.x, s4.y);
        ctx.lineTo(s5.x, s5.y);
        ctx.stroke();
        ctx.moveTo(s6.x, s6.y);
        ctx.lineTo(s7.x, s7.y);
        ctx.stroke();
    }

    // draw coordinate frame
    if(1)
    {
        // world space
        let p0 = new float3(0  ,  0,   0);
        let p1 = new float3(0  ,  0,   1.1);
        let p2 = new float3(1.1,  0,   0);
        let p3 = new float3(0  ,  1.1, 0);
        let p4 = new float3(0  , -1.1, 0);
        
        p1 = basis.toLocal(p1);
        p2 = basis.toLocal(p2);
        p3 = basis.toLocal(p3);
        p4 = basis.toLocal(p4);

        const s0 = projectPointToScreen(p0, width, height, viewProjection);
        const s1 = projectPointToScreen(p1, width, height, viewProjection);
        const s2 = projectPointToScreen(p2, width, height, viewProjection);
        const s3 = projectPointToScreen(p3, width, height, viewProjection);
        const s4 = projectPointToScreen(p4, width, height, viewProjection);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = defaultLineColor;
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();

        drawLineArrow2D(s0, s1, 3, "rgb(255 0 0 / 100%)");
        drawLineArrow2D(s0, s2, 3, "rgb(0 255 0 / 100%)");
        drawLineArrow2D(s0, s3, 3, "rgb(0 0 255 / 100%)");

        drawText(s1.add(normalize(s1.sub(s0)).mul(10)).add(new float2(0, 5)), "u", "bold 24px monospace", "red", "center");
        drawText(s2.add(normalize(s2.sub(s0)).mul(10)).add(new float2(0, 5)), "v", "bold 24px monospace", "rgb(0 255 0)", "center");
        drawText(s3.add(normalize(s3.sub(s0)).mul(10)).add(new float2(0, 5)), "w", "bold 24px monospace", "blue", "center");

    }
        

    const cylinder = new Cylinder(new float3(0, 0, 0), 1, 1000);
    const sphere = new Sphere(new float3(0, 0, 0), 1);
    const plane = new Plane(new float3(0, 0, 0), new float3(0, 1, 0));
    const origin = new float3(0,0,0);
    const sinTheta = Math.sin(-theta + Math.PI / 2);
    const cosTheta = Math.cos(-theta + Math.PI / 2);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    let wi = normalize(new float3(sinTheta * cosPhi, sinTheta * sinPhi, cosTheta));

    // const ray = new Ray(wi, wi.neg());
    const ray = new Ray(wi.mul(1000), wi.neg());
    const result = cylinder.intersect(ray, 0, 10000);
    // const result = sphere.intersect(ray, 0, 10000);
    // const result = plane.intersect(ray);
    if(result.hit)
    {
        const hairIOR = 1.55;
        const airIOR = 1.0;
        const eta = airIOR / hairIOR;
        const etaP = Math.sqrt(hairIOR * hairIOR - Math.sin(theta) * Math.sin(theta)) / Math.cos(theta);
        // let wr = refract(wi.neg(), result.normal, airIOR / etaP);
        let wr = refract(wi.neg(), result.normal, eta);
        result.position = basis.toLocal(result.position);
        result.normal = basis.toLocal(result.normal);
        wi = basis.toLocal(wi);
        wr = basis.toLocal(wr);

        if(0)
        {
            const p1 = projectPointToScreen(result.position, width, height, viewProjection);
            const p2 = projectPointToScreen(result.position.add(result.normal.mul(0.5)), width, height, viewProjection);
            const p3 = projectPointToScreen(result.position.add(wi.mul(0.5)), width, height, viewProjection);
            const p4 = projectPointToScreen(result.position.add(wr.mul(0.5)), width, height, viewProjection);
            drawCircle(p1, 5);
            drawLineArrow2D(p1, p2, 3, "green");
            drawLineArrow2D(p1, p3, 3, "white");
            drawLineArrow2D(p1, p4, 3, "red");
            drawText(p1, "intersection");
        }

        if(1)
        {
            const p0 = projectPointToScreen(cylinder.center, width, height, viewProjection);
            const p1 = projectPointToScreen(negative(result.normal), width, height, viewProjection);
            const p2 = projectPointToScreen(result.normal, width, height, viewProjection);
            const p3 = projectPointToScreen(wi, width, height, viewProjection);
            const p4 = projectPointToScreen(wr, width, height, viewProjection);

            // normal of the intersection point
            // drawText(new float2(p2.x - 8, p2.y - 8), "n", undefined, defaultLineColor, "center");
            drawLine2D(p1, p2, 1.5, "rgb(255 255 255 / 50%)");
            // drawLineArrow2D(p0, p2, 2, "green");
             
            // wi
            drawLineArrow2D(p0, p3, 2.5, "yellow");
            drawText(p3.add(normalize(p3.sub(p0)).mul(10)), "ωi", undefined, defaultLineColor, "center");

            const hi_1 = projectToPlane(wi, result.normal);
            const p5 = projectPointToScreen(hi_1, width, height, viewProjection);
            drawLine2D(p3, p5, 1.5, defaultLineColor);

            // project refracted vector up
            const ht_2 = projectToPlane(wr, result.normal);
            const p6 = projectPointToScreen(ht_2, width, height, viewProjection);
            drawLine2D(p4, p6, 1.5, defaultLineColor);
            // drawCircle(p4, 5);

            // wr
            drawLineArrow2D(p0, p4, 2.5, "magenta");
            drawText(p4.add(normalize(p4.sub(p0)).mul(12)), "ωr", undefined, defaultLineColor, "center");

            // draw projection of wi
            const planeNormal = basis.toLocal(new float3(0, 0, 1));
            const wi_projected = projectToPlane(wi, planeNormal);
            const p7 = projectPointToScreen(wi_projected, width, height, viewProjection);
            drawLine2D(p0, p7, 1.5, defaultLineColor);
            // drawCircle(p7, 4);

            const sinGammaI = Math.sin(theta);
            const cosGammaI = Math.cos(theta);
            
            const phi = Math.atan2(wi.y, wi.x);
            const gamma = Math.acos(dot(normalize(wi), normalize(wi_projected)));
            const sinGamma = Math.sin(gamma);
            const cosGamma = Math.cos(gamma);

            {
                const v0 = wi;
                const v1 = normalize(wi_projected);
                const arcVertices = [];
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                // ctx.moveTo(p3.x, p3.y);
                let l = length(wi_projected) / length(wi) * 0.5;
                for (let t = 0; t <= 1.05; t += 0.05)
                {
                    // const p = v0.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * l).add(v1.mul(Math.sin(t * gamma) / Math.sin(gamma) * l));
                    const p = v0.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.4).add(v1.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.4));
                    const projected = projectPointToScreen(p, width, height, viewProjection);
                    arcVertices.push(projected);
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
                    const p = v1.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.4).add(v0.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.4));
                    // const p = v1.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * l).add(v0.mul(Math.sin(t * gamma) / Math.sin(gamma) * l));
                    t = 1;
                    const p1 = v1.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.4).add(v0.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.4));
                    // const p1 = v1.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * l).add(v0.mul(Math.sin(t * gamma) / Math.sin(gamma) * l));
                    drawArrowHead(projectPointToScreen(p, width, height, viewProjection), projectPointToScreen(p1, width, height, viewProjection), 2);
                }
                ctx.textAlign = "center";
                // const angleTextPosition = mul(v0.mul(0.5).add(v1.mul(0.5)), 1);
                const angleTextPosition = v1.mul(Math.sin((1 - 0.5) * gamma) / Math.sin(gamma) * 0.4).add(v0.mul(Math.sin(0.5 * gamma) / Math.sin(gamma) * 0.4));

                // const angleTextPosition = mul(v0.mul(l).add(v1.mul(l)), 0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                drawText(angleTextPosition_ss.add(normalize(angleTextPosition_ss.sub(p0)).mul(8)), "θi", "16px math", defaultLineColor, "center");

                // drawLine2D(projectPointToScreen(v1.mul(0.4), width, height, viewProjection), p0, 1.5, defaultLineColor, [8, 5]);
            }

            // phiI
            {
                const v0 = normalize(wi_projected);
                const v1 = basis.toLocal(normalize(new float3(1, 0, 0)));
                const gamma = Math.min(Math.acos(dot(v0, v1)), radians(179));
                const arcVertices = [];
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let t = 0; t <= 1.05; t += 0.05)
                {
                    const p = v0.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.5).add(v1.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.5));
                    const projected = projectPointToScreen(p, width, height, viewProjection);
                    if(t === 0)
                    {
                        ctx.moveTo(projected.x, projected.y);
                        continue;   
                    }
                    arcVertices.push(projected);
                    ctx.lineTo(projected.x, projected.y);
                }
                ctx.stroke();
                {
                    let t = 0.9;
                    const p = v1.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.5).add(v0.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.5));
                    t = 1;
                    const p1 = v1.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.5).add(v0.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.5));
                    drawArrowHead(projectPointToScreen(p, width, height, viewProjection), projectPointToScreen(p1, width, height, viewProjection), 2);
                }
                // const angleTextPosition = mul(v0.mul(0.3).add(v1.mul(0.3)), 0.5);
                // const angleTextPosition = mul(v0.mul(0.5).add(v1.mul(0.5)), 1);
                // const angleTextPosition = mul(v0.mul(0.4).add(v1.mul(0.4)), 0.5);
                const angleTextPosition = v1.mul(Math.sin((1 - 0.5) * gamma) / Math.sin(gamma) * 0.5).add(v0.mul(Math.sin(0.5 * gamma) / Math.sin(gamma) * 0.5));
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                drawText(angleTextPosition_ss.add(normalize(angleTextPosition_ss.sub(p0)).mul(16)), "Φi", "16px normal math", defaultLineColor, "center");

                // const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                // drawText(new float2(angleTextPosition_ss.x, angleTextPosition_ss.y - 8), "Φi", undefined, defaultLineColor, "center");

                const p = v0.mul(0.5);
                const p_ss = projectPointToScreen(p, width, height, viewProjection);
                // drawLine2D(projectPointToScreen(v0.mul(1), width, height, viewProjection), p0, 1.5, defaultLineColor, [8, 5]);

            }

            // modified index of refraction
            const etaP = Math.sqrt(hairIOR * hairIOR - sinGamma * sinGamma) / cosGamma;
            const wt_v = refract(normalize(wi_projected).neg(), result.normal, airIOR / etaP);

            // refraction of the projected incomming vector v_i' with eta
            const wtt_projected = projectToPlane(wr, planeNormal);
            const wtt_p = projectPointToScreen(wtt_projected, width, height, viewProjection);
            drawLine2D(p0, wtt_p, 1.5, defaultLineColor);
            // drawCircle(wtt_p, 5);

            // draw line from wi to projected wi
            drawLine2D(p3, p7, 1.5, defaultLineColor);

            // phiR
            {
                const v0 = normalize(wtt_projected);
                const v1 = basis.toLocal(normalize(new float3(1, 0, 0)));
                const gamma = Math.min(Math.acos(dot(v0, v1)), radians(179));
                const arcVertices = [];
                ctx.strokeStyle = defaultLineColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let t = 0; t <= 1.05; t += 0.05)
                {
                    const p = v0.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.4).add(v1.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.4));
                    const projected = projectPointToScreen(p, width, height, viewProjection);
                    if(t === 0)
                    {
                        ctx.moveTo(projected.x, projected.y);
                        continue;   
                    }
                    arcVertices.push(projected);
                    ctx.lineTo(projected.x, projected.y);
                }
                ctx.stroke();
                {
                    let t = 0.9;
                    const p = v1.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.4).add(v0.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.4));
                    t = 1;
                    const p1 = v1.mul(Math.sin((1 - t) * gamma) / Math.sin(gamma) * 0.4).add(v0.mul(Math.sin(t * gamma) / Math.sin(gamma) * 0.4));
                    drawArrowHead(projectPointToScreen(p, width, height, viewProjection), projectPointToScreen(p1, width, height, viewProjection), 2);
                }
                ctx.textAlign = "center";
                // const angleTextPosition = mul(v0.mul(0.5).add(v1.mul(0.5)), 0.5);
                // const angleTextPosition = mul(v0.mul(0.4).add(v1.mul(0.4)), 0.5);
                // const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                // drawText(new float2(angleTextPosition_ss.x + 8, angleTextPosition_ss.y + 8), "Φr", undefined, defaultLineColor, "center");
                const angleTextPosition = v1.mul(Math.sin((1 - 0.5) * gamma) / Math.sin(gamma) * 0.4).add(v0.mul(Math.sin(0.5 * gamma) / Math.sin(gamma) * 0.4));
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                drawText(angleTextPosition_ss.add(normalize(angleTextPosition_ss.sub(p0)).mul(16)), "Φr", "16px normal math", defaultLineColor, "center");

            }

            // projected refracted vector s(η,v_i)' to refracted vector s(η,v_i)
            drawLine2D(p4, wtt_p, 1.5, defaultLineColor);

            // draw s_i (h_i,1 to origin)
            drawLine2D(p5, p0, 1.5, defaultLineColor);

            const delta = Math.acos(clamp(dot(normalize(wr), normalize(wtt_projected)), -1, 1));

            // delta
            {
                const v0 = wr;
                const v1 = normalize(wtt_projected);
                const arcVertices = [];
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = defaultLineColor;
                ctx.beginPath();
                for (let t = 0; t <= 1.05; t += 0.05)
                {
                    const p = v0.mul(Math.sin((1 - t) * delta) / Math.sin(delta) * 0.3).add(v1.mul(Math.sin(t * delta) / Math.sin(delta) * 0.3));
                    const projected = projectPointToScreen(p, width, height, viewProjection);
                    if(t === 0)
                    {
                        ctx.moveTo(projected.x, projected.y);
                        continue;   
                    }
                    arcVertices.push(projected);
                    ctx.lineTo(projected.x, projected.y);
                }
                ctx.stroke();
                ctx.stroke();
                {
                    let t = 0.9;
                    const p = v1.mul(Math.sin((1 - t) * delta) / Math.sin(delta) * 0.3).add(v0.mul(Math.sin(t * delta) / Math.sin(delta) * 0.3));
                    t = 1;
                    const p1 = v1.mul(Math.sin((1 - t) * delta) / Math.sin(delta) * 0.3).add(v0.mul(Math.sin(t * delta) / Math.sin(delta) * 0.3));
                    drawArrowHead(projectPointToScreen(p, width, height, viewProjection), projectPointToScreen(p1, width, height, viewProjection), 1.5);
                }
                const angleTextPosition = mul(v0.mul(0.3).add(v1.mul(0.3)), 0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                drawText(new float2(angleTextPosition_ss.x, angleTextPosition_ss.y - 8), "θr", undefined, defaultLineColor, "center");
            }

            if(0)
            {

                ctx.textAlign = "center";
                drawLine2D(p0, p3, 3);
                let text = "v_i";
                const metrics = ctx.measureText(text);
                // drawText(new float2(p3.x - metrics.width, p3.y - (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * 0.5), text);
                drawText(new float2(p3.x, p3.y - 8), text);
                drawLine2D(p0, p4, 3);
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
                
                ctx.save();
                ctx.textAlign = "center";
                ctx.translate(s_i_ss.x, s_i_ss.y);
                ctx.rotate(s_i_angle);
                drawText(new float2(0, 10), "si");
                ctx.restore();

                // project the refracted vector up towards the plane
                const ht_2 = projectToPlane(wr, result.normal);
                const p6 = projectPointToScreen(ht_2, width, height, viewProjection);
                drawLine2D(p4, p6, 3);
                ctx.textAlign = "center";
                drawText(new float2(p4.x, p4.y + 16), "s(η,v_i)");
                drawCircle(p4, 4, `rgb(255 255 255)`);
                // draw refracted vector to normal axis
                // drawLine2D(p6, projectPointToScreen(new float3(0, ht_2.y, 0), width, height, viewProjection), 5, "red");
                drawLine2D(p6, p0, 1.5);

                const s_i_n_ss = projectPointToScreen(ht_2.add(cylinder.center).mul(0.5), width, height, viewProjection);
                ctx.textAlign = "center";
                // drawText(new float2(s_i_n_ss.x, s_i_n_ss.y - 8), "s_i/η");
                {
                    const sinDeltaVector = (new float2(p6.x - p0.x, p6.y - p0.y)).normalize();
                    let sinDeltaAngle = Math.atan2(sinDeltaVector.y, sinDeltaVector.x);
                    if (sinDeltaAngle > Math.PI / 2)
                    {
                        sinDeltaAngle -=  Math.PI;
                    }
                    else if (sinDeltaAngle < -Math.PI / 2)
                    {
                        sinDeltaAngle += Math.PI;
                    }
                    
                    ctx.save();
                    ctx.translate(s_i_n_ss.x, s_i_n_ss.y);
                    ctx.rotate(sinDeltaAngle);
                    drawText(new float2(0, 10), "si/η");
                    ctx.restore();
                }
                const ht_3_ss = projectPointToScreen(new float3(0, wr.y, 0), width, height, viewProjection);
                drawLine2D(p4, ht_3_ss, 2);

                // draw projection of wi to normal plane (azimuthal)
                const planeNormal = basis.toLocal(new float3(0, 0, 1));
                const wi_projected = projectToPlane(wi, planeNormal);
                const wi_projected_ss = projectPointToScreen(wi_projected, width, height, viewProjection);
                drawLine2D(p0, wi_projected_ss, 3);
                drawText(new float2(wi_projected_ss.x, wi_projected_ss.y - 8), "v_i'");
                drawCircle(wi_projected_ss, 4);
                // from wi to wi projected to normal plane
                drawLine2D(p3, wi_projected_ss, 2, "white", [8, 5]);

                const sinGammaI = Math.sin(theta);
                const cosGammaI = Math.cos(theta);

                const phi = Math.atan2(wi.y, wi.x);
                const gamma = Math.acos(dot(normalize(wi), normalize(wi_projected)));
                const sinGamma = Math.sin(gamma);
                const cosGamma = Math.cos(gamma);
                // draw angle γ
                drawArcBetweenPoints(wi, wi_projected, viewProjection);
                const angleTextPosition = wi.mul(0.25).add(wi_projected.mul(0.25)).mul(0.5);
                const angleTextPosition_ss = projectPointToScreen(angleTextPosition, width, height, viewProjection);
                ctx.save();
                ctx.textAlign = "right";
                drawText(new float2(angleTextPosition_ss.x, angleTextPosition_ss.y - 8),  "γ");
                ctx.restore();

                // draw the refracted vector using the modified index of refraction
                const etaP = Math.sqrt(hairIOR * hairIOR - sinGamma * sinGamma) / cosGamma;
                const wt_v = refract(normalize(wi_projected).neg(), result.normal, airIOR / etaP);
                const wt_p = projectPointToScreen(wt_v, width, height, viewProjection);
                drawLine2D(p0, wt_p, 3);
                ctx.save();
                ctx.textAlign = "start";
                drawText(new float2(wt_p.x, wt_p.y + 16), "s(η',v_i')");
                drawCircle(wt_p, 4, `rgb(255 255 255)`);

                const wtt_projected = projectToPlane(wr, planeNormal);
                const wtt_p = projectPointToScreen(wtt_projected, width, height, viewProjection);
                drawLine2D(p0, wtt_p, 3);

                drawText(new float2(wtt_p.x + 8, wtt_p.y), "s(η,v_i)'");
                ctx.restore();
                drawCircle(wtt_p, 4, `rgb(255 255 255)`);

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

                const sinDeltaTextPosition = projectPointToScreen(ht_2.add(wtt_projected_projected).mul(0.5), width, height, viewProjection);
                const sinDeltaVector = (new float2(p6.x - wtt_projected_p.x, p6.y - wtt_projected_p.y)).normalize();
                let sinDeltaAngle = Math.atan2(sinDeltaVector.y, sinDeltaVector.x);
                ctx.save();
                ctx.translate(sinDeltaTextPosition.x, sinDeltaTextPosition.y);
                ctx.rotate(sinDeltaAngle);
                drawText(new float2(0, -8), "sinδ");
                ctx.restore();

                // project wi down y axis
                const h_i_projected = new float3(wi_projected.x, 0, wi_projected.z);
                const h_i_projected_ss = projectPointToScreen(h_i_projected, width, height, viewProjection);
                drawLine2D(h_i_projected_ss, wi_projected_ss, 1.5);

                const sinThetaTextPosition = projectPointToScreen(hi_1.add(h_i_projected).mul(0.5), width, height, viewProjection);
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

                // draw angle δ
                drawArcBetweenPoints(wr, wtt_projected, viewProjection);

                const angleTextPosition1 = wr.mul(0.3).add(normalize(wtt_projected).mul(0.3)).mul(0.5);
                const angleTextPosition1_ss = projectPointToScreen(angleTextPosition1, width, height, viewProjection);
                drawText(new float2(angleTextPosition1_ss.x, angleTextPosition1_ss.y + 4), "δ");
            }
            
            // let column = 0;
            // const textHeight = 16;
            // const canvas_pos = new float2(50, 50);
            // ctx.textAlign = "left";

            // const sinThetaI = wi.x;
            // const phiI = Math.atan2(wi.y, wi.z);
            // const sinThetaO = wr.x;
            // const phiO = Math.atan2(wr.y, wr.z);

            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `thetaI                            ${degrees(Math.asin(sinThetaI)).toFixed(2)}°`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `phiI                              ${degrees(phiI).toFixed(2)}°`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `thetaO                            ${degrees(Math.asin(sinThetaO)).toFixed(2)}°`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `phiO                              ${degrees(phiO).toFixed(2)}°`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `gamma                             ${degrees(gamma).toFixed(2)}°`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `sinGamma                          ${sinGamma.toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `sinGammaDist                      ${distance(hi_1, new float3(0,0,0)).toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `cosGamma                          ${cosGamma.toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `|v_i'|                            ${length(wi_projected).toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `|s(n,v_i)'|                       ${length(wtt_projected).toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `delta                             ${degrees(delta).toFixed(2)}°`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `cosDelta                          ${Math.cos(delta).toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `sinDelta                          ${Math.sin(delta).toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `|wt_proj - wt|                    ${distance(wtt_projected, wr).toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `etaP                              ${etaP.toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `etaP: ior * cosDelta / cosGamma   ${(hairIOR * Math.cos(delta) / cosGamma).toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `eta:  sinGamma / sinDelta         ${(sinGamma / Math.sin(delta)).toFixed(2)}`);
            // drawText(new float2(canvas_pos.x, canvas_pos.y + ++column * textHeight), `eta:  s_i / (s_i / n)             ${(length(hi_1) / length(ht_2)).toFixed(2)}`);

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
