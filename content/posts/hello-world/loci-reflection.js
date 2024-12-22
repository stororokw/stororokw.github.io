import {float2, float3, float4, mat4x4, mul, dot, Camera, OrthonormalBasis, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, 
    refract, negative, projectToPlane, reflect, CylinderY,clamp,
    project} from "./math.js"

const canvas = document.querySelector('.loci-reflection'); 
let width = canvas.width = Math.min(innerWidth, 512);
let height = canvas.height = Math.min(innerWidth, 512);

const ctx = canvas.getContext('2d');

const thetaPicker = document.querySelector('#loci-reflection-theta');
const phiPicker = document.querySelector('#loci-reflection-phi');
// const testerPicker = document.querySelector('#tester');

const output = document.querySelector('.loci-reflection-theta');
const output1 = document.querySelector('.loci-reflection-phi');
// const output2 = document.querySelector('.output2');
let clearColor = "#2b2b2b";

let theta = degToRad(thetaPicker.value);
let phi = degToRad(phiPicker.value);

thetaPicker.addEventListener('input', () => {
    output.textContent = thetaPicker.value;
    theta = degToRad(clamp(thetaPicker.value, -89.4, 89.4));
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
camera.distance = 5;

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
    
    ctx.lineWidth = 5;
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
    const view = camera.view;
    const forward = camera.forward;
    const up = camera.up;
    const right = camera.right;
    const position = camera.position;
    const projection = camera.projection;
    let viewProjection = mul(view, projection);
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, width, height);
    if(0)
    {
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
    const lookAtView = mat4x4.lookTo(new float3(0, 0, 0), camera.forward.neg(), camera.up).transpose();

    // Draw Circle
    if(1)
    {
        let canvasPos = new float2(0, 0);
        const v = new float4(0, 0, 0, 1);
        const result = mul(v, viewProjection);
        const originScreenX = ((result.x / result.w) * 0.5 + 0.5) * width + canvasPos.x;
        const originScreenY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height + canvasPos.y;
        const p1 = new float2(originScreenX, originScreenY);

        let inc = 2 * Math.PI / 360;
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
            vertices1.push(projectPointToScreen(v1, width, height, mul(lookAtView, viewProjection)));

            angle += inc;
        }

        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(255 255 255 / 50%)`;

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for(let k = 1; k < vertices.length; ++k)
        {
            ctx.lineTo(vertices[k].x, vertices[k].y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(vertices1[0].x, vertices1[0].y);
        for(let k = 1; k < vertices1.length; ++k)
        {
            ctx.lineTo(vertices1[k].x, vertices1[k].y);
        }
        ctx.stroke();
    }
    
    // Draw cylinder
    if(0)
    {
        const inc = 2 * Math.PI / 360;
        const angle = -Math.PI;
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
                const y = -cylinderHeight * 0.5 + j * sectorStep;
                const z = mRadius * sinTheta;

                const position = new float3(x, y, z);
                const p1 = projectPointToScreen(position, width, height, viewProjection);
                vertices.push(p1);
                // draw_list->AddCircleFilled(p1, 2, "rgb(255, 255, 255, 255));
                drawCircle(p1, 5, "rgb(255 255 255 / 50%)");
                const cylinderNormal = normalize(new float3(cosTheta, 0, sinTheta));

                const p3 = projectPointToScreen(position.add(cylinderNormal.mul(0.1)), width, height, viewProjection);
                drawLine2D(p1, p3, 2, "rgb(0 255 0 / 50%)");
            }
        }
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

        ctx.lineWidth = 3;
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
        
        ctx.save();
        drawText(new float2(s2.x, s2.y - 16), "u", "red", "bold 24px monospace", "center");
        ctx.restore();
        drawLineArrow2D(s0, s2, 3, "red");

        ctx.strokeStyle = `rgb(255 255 255)`;
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s4.x, s4.y);
        ctx.stroke();
    }

    // draw normal plane
    if(0)
    {
        const p0 = new float3(-1, -1, 0);
        const p1 = new float3( 1, -1, 0);
        const p2 = new float3( 1,  1, 0);
        const p3 = new float3(-1,  1, 0);

        const s0 = projectPointToScreen(p0, width, height, viewProjection);
        const s1 = projectPointToScreen(p1, width, height, viewProjection);
        const s2 = projectPointToScreen(p2, width, height, viewProjection);
        const s3 = projectPointToScreen(p3, width, height, viewProjection);
        
        ctx.strokeStyle = `rgb(255 255 255)`;
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
    if(0)
    {
        const p0 = new float3(-1, 0, -1);
        const p1 = new float3( 1, 0, -1);
        const p2 = new float3( 1, 0,  1);
        const p3 = new float3(-1, 0,  1);

        const s0 = projectPointToScreen(p0, width, height, viewProjection);
        const s1 = projectPointToScreen(p1, width, height, viewProjection);
        const s2 = projectPointToScreen(p2, width, height, viewProjection);
        const s3 = projectPointToScreen(p3, width, height, viewProjection);

        ctx.strokeStyle = `rgb(255 255 255)`;
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

    // draw intersection h1
    {
        const cylinder = new CylinderY(new float3(0, 0, 0), 1, 1000);
        const plane = new Plane(new float3(0, 0, 0), new float3(0, 1, 0));
        const origin = new float3(0,0,0);
        const sinTheta = Math.sin(-theta + Math.PI / 2);
        const cosTheta = Math.cos(-theta + Math.PI / 2);
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        // const wi = normalize(new float3(sinTheta * cosPhi, sinTheta * sinPhi, cosTheta));
        const wi = normalize(new float3(sinTheta * cosPhi, cosTheta, sinTheta * sinPhi));

        const ray = new Ray(wi.mul(100), wi.neg());
        // const result = cylinder.intersect(ray, 0, 10000);
        const result = cylinder.intersect(ray, 0, 100);
        if(result.hit)
        {
            const hairIOR = 1.55;
            const airIOR = 1.0;
            const eta = airIOR / hairIOR;
            const wr = reflect(wi, result.normal);

            // draw intersection point
            if(0)
            {
                const p1 = projectPointToScreen(result.position, width, height, viewProjection);
                drawCircle(p1, 5, "blue");

                const p2 = projectPointToScreen(result.position.add(result.normal.mul(0.5)), width, height, viewProjection);
                drawLine2D(p1, p2, 2, "rgb(0 255 0)");

                const p3 = projectPointToScreen(result.position.add(wi.mul(0.5)), width, height, viewProjection);
                drawLine2D(p1, p3, 2);

                const p4 = projectPointToScreen(result.position.add(wr.mul(0.5)), width, height, viewProjection);
                drawLine2D(p1, p4, 2, "rgb(255 0 0)");
            }

            // draw longitudinal line
            {
                let canvasPos = new float2(0, 0);
                const v = new float4(0, 0, 0, 1);
                const result = mul(v, viewProjection);
                const originScreenX = ((result.x / result.w) * 0.5 + 0.5) * width + canvasPos.x;
                const originScreenY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height + canvasPos.y;
                const p1 = new float2(originScreenX, originScreenY);
        
                let inc = 2 * Math.PI / 360;
                let angle = 0;
                let vertices = [];
                let vertices1 = [];
                // for (let i = 0; i <= radToDeg(theta + Math.PI / 2); i++)
                for (let i = 0; i <= 180; i++)
                    {
                    const v = normalize(new float3(Math.sin(angle) * cosPhi, Math.cos(angle), Math.sin(angle) * sinPhi));
                    vertices.push(projectPointToScreen(v, width, height, viewProjection));
                    angle += inc;
                }
        
                ctx.save();
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgb(255 255 255 / 75%)`;
        
                ctx.beginPath();
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for(let k = 1; k < vertices.length; ++k)
                {
                    ctx.lineTo(vertices[k].x, vertices[k].y);
                }
                ctx.stroke();
                ctx.restore();
            }

            {
                const wr = reflect(wi, result.normal).neg();
                // const wr = reflect(wi, result.normal);
                const p0 = projectPointToScreen(cylinder.center, width, height, viewProjection);

                const p1 = projectPointToScreen(result.normal.neg(), width, height, viewProjection);
                const p2 = projectPointToScreen(result.normal, width, height, viewProjection);

                // Draw cone circle
                {
                    const v = new float3(0, 0, 0);
                    const p1 = projectPointToScreen(v, width, height, viewProjection);
                    const inc = 30 * Math.PI / 360;
                    let angle = 0.0;
                    const vertices = [];
                    const coneVertices = [];
                    // coneVertices.push(p1);
                    const sphereRadius = 1;
                    let index = 0;
                    // for (let i = 0; i <= 360; i++)
                    for (let i = 0; i <= 2 * Math.PI; i+=inc)
                    {
                        const r = Math.sqrt(sphereRadius * sphereRadius - wr.y * wr.y);
                        const v = new float3(r * Math.cos(angle), wr.y, r * Math.sin(angle));
                        const result = projectPointToScreen(v, width, height, viewProjection);
                        vertices.push(result);
                        coneVertices.push(result);
                        angle += inc;
                        // drawText(result, `${index++}`, "rgb(255 255 255)", undefined, "center");

                    }
                    ctx.strokeStyle = "white";
                    ctx.beginPath();
                    ctx.moveTo(vertices[0].x, vertices[0].y);
                    for(const p of vertices)
                    {
                        ctx.lineTo(p.x, p.y);
                    }
                    ctx.stroke();

                    ctx.fillStyle = "rgb(0 255 0 / 25%)";
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(coneVertices[6].x, coneVertices[6].y);
                    ctx.lineTo(coneVertices[5].x, coneVertices[5].y);
                    ctx.lineTo(coneVertices[4].x, coneVertices[4].y);
                    ctx.lineTo(coneVertices[3].x, coneVertices[3].y);
                    ctx.lineTo(coneVertices[2].x, coneVertices[2].y);
                    ctx.lineTo(coneVertices[1].x, coneVertices[1].y);
                    ctx.lineTo(coneVertices[0].x, coneVertices[0].y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.closePath();
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(coneVertices[18].x, coneVertices[18].y);
                    ctx.lineTo(coneVertices[19].x, coneVertices[19].y);
                    ctx.lineTo(coneVertices[20].x, coneVertices[20].y);
                    ctx.lineTo(coneVertices[21].x, coneVertices[21].y);
                    ctx.lineTo(coneVertices[22].x, coneVertices[22].y);
                    ctx.lineTo(coneVertices[23].x, coneVertices[23].y);
                    ctx.lineTo(coneVertices[24].x, coneVertices[24].y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.closePath();
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(coneVertices[ 6].x, coneVertices[ 6].y);
                    ctx.lineTo(coneVertices[ 7].x, coneVertices[ 7].y);
                    ctx.lineTo(coneVertices[ 8].x, coneVertices[ 8].y);
                    ctx.lineTo(coneVertices[ 9].x, coneVertices[ 9].y);
                    ctx.lineTo(coneVertices[10].x, coneVertices[10].y);
                    ctx.lineTo(coneVertices[11].x, coneVertices[11].y);
                    ctx.lineTo(coneVertices[12].x, coneVertices[12].y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(coneVertices[12].x, coneVertices[12].y);
                    ctx.lineTo(coneVertices[13].x, coneVertices[13].y);
                    ctx.lineTo(coneVertices[14].x, coneVertices[14].y);
                    ctx.lineTo(coneVertices[15].x, coneVertices[15].y);
                    ctx.lineTo(coneVertices[16].x, coneVertices[16].y);
                    ctx.lineTo(coneVertices[17].x, coneVertices[17].y);
                    ctx.lineTo(coneVertices[18].x, coneVertices[18].y);
                    ctx.lineTo(p1.x, p1.y);
                    ctx.closePath();
                    ctx.fill();

                }
                // drawText(new float2(p2.x + 8, p2.y - 8), "n1", "rgb(255 255 255)", undefined, "right");
        
                // drawLine2D(p1, p2, 2, "rgb(255 255 255)");
                // drawLine2D(p0, p2, 2, "rgb(255 255 255)");
                        
                drawText(p2.add(normalize(p2.sub(p0)).mul(16)), "w", "rgb(50 50 255)",  "bold 24px monospace", "center");
                drawLine2D(p0, p1, 2, "rgb(255 255 255)");
                drawLineArrow2D(p0, p2, 3, "rgb(50 50 255)");

                const p3 = projectPointToScreen(wi, width, height, viewProjection);
                // drawLine2D(p0, p3, 2, "rgb(255 255 255)");
                drawLineArrow2D(p0, p3, 2, "rgb(255 255 255)");
                drawText(new float2(p3.x - 10, p3.y ), "vi,1", "rgb(255 255 255)", undefined, "right");
        
                const p4 = projectPointToScreen(wr, width, height, viewProjection);
                // drawLine2D(p0, p4, 2, "rgb(255 0 0)");
                drawLineArrow2D(p0, p4, 2, "rgb(255 0 0)");
        
                const hi_1 = new float3(wi.x, 0, wi.z);
                const p5 = projectPointToScreen(hi_1, width, height, viewProjection);
                drawLine2D(p3, p5, 2, "rgb(255 255 255)");
                drawText(new float2(p5.x + 8, p5.y + 16), "hi,1", "rgb(255 255 255)", undefined, "left");
        
                const ht_2 = new float3(wr.x, 0, wr.z);
                const p6 = projectPointToScreen(ht_2, width, height, viewProjection);
                drawLine2D(p4, p6, 2, "rgb(255 0 0)");
                drawText(new float2(p4.x + 16, p4.y + 16), "vr,1", "rgb(255 255 255)", undefined, "center");
                drawText(new float2(p6.x + 8, p6.y + 16), "hr,1", "rgb(255 255 255)", undefined, "left");

            }

        }
    }

    // draw intersection h2
    {
        const cylinder = new CylinderY(new float3(0, 0, 0), 1, 1000);
        const plane = new Plane(new float3(0, 0, 0), new float3(0, 1, 0));
        const origin = new float3(0,0,0);
        const sinTheta = Math.sin(-theta + Math.PI / 2);
        const cosTheta = Math.cos(-theta + Math.PI / 2);
        const phi = 0;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const wi = normalize(new float3(sinTheta * cosPhi, cosTheta, sinTheta * sinPhi));

        const ray = new Ray(wi.mul(100), wi.neg());
        // const result = cylinder.intersect(ray, 0, 10000);
        const result = cylinder.intersect(ray, 0, 100);
        if(result.hit)
        {
            const hairIOR = 1.55;
            const airIOR = 1.0;
            const eta = airIOR / hairIOR;
            const wr = reflect(wi, result.normal);

            // draw intersection point
            if(0)
            {
                const p1 = projectPointToScreen(result.position, width, height, viewProjection);
                drawCircle(p1, 5, "blue");

                const p2 = projectPointToScreen(result.position.add(result.normal.mul(0.5)), width, height, viewProjection);
                drawLine2D(p1, p2, 2, "rgb(0 255 0)");

                const p3 = projectPointToScreen(result.position.add(wi.mul(0.5)), width, height, viewProjection);
                drawLine2D(p1, p3, 2);

                const p4 = projectPointToScreen(result.position.add(wr.mul(0.5)), width, height, viewProjection);
                drawLine2D(p1, p4, 2, "rgb(255 0 0)");
            }
            
            // draw longitudinal line
            {
                let canvasPos = new float2(0, 0);
                const v = new float4(0, 0, 0, 1);
                const result = mul(v, viewProjection);
                const originScreenX = ((result.x / result.w) * 0.5 + 0.5) * width + canvasPos.x;
                const originScreenY = (1 - (((result.y / result.w)) * 0.5 + 0.5)) * height + canvasPos.y;
                const p1 = new float2(originScreenX, originScreenY);
        
                let inc = 2 * Math.PI / 360;
                let angle = 0;
                let vertices = [];
                let vertices1 = [];
                // for (let i = 0; i <= radToDeg(theta + Math.PI / 2); i++)
                for (let i = 0; i <= 360; i++)
                {
                    const v = normalize(new float3(Math.sin(angle) * cosPhi, Math.cos(angle), Math.sin(angle) * sinPhi));
                    vertices.push(projectPointToScreen(v, width, height, viewProjection));
                    angle += inc;
                }
        
                ctx.save();
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgb(255 255 255 / 50%)`;
        
                ctx.beginPath();
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for(let k = 1; k < vertices.length; ++k)
                {
                    ctx.lineTo(vertices[k].x, vertices[k].y);
                }
                ctx.stroke();
                ctx.restore();
            }

            {
                const wr = reflect(wi, result.normal).neg();
                // const wr = reflect(wi, result.normal);
                const p0 = projectPointToScreen(cylinder.center, width, height, viewProjection);

                const p1 = projectPointToScreen(result.normal.neg(), width, height, viewProjection);
                const p2 = projectPointToScreen(result.normal, width, height, viewProjection);
                // drawText(new float2(p2.x + 8, p2.y - 8), "n2", "rgb(255 255 255)", undefined, "left");
        
                drawLine2D(p1, p2, 2, "rgb(255 255 255)");
                drawLine2D(p0, p2, 2, "rgb(255 255 255)");
        
                const p3 = projectPointToScreen(wi, width, height, viewProjection);
                // drawLine2D(p0, p3, 2, "rgb(255 255 255)");
                drawLineArrow2D(p0, p3, 2, "rgb(255 255 255)");
                drawText(new float2(p3.x + 16, p3.y), "vi,2", "rgb(255 255 255)", undefined, "left");
        
                const p4 = projectPointToScreen(wr, width, height, viewProjection);
                // drawLine2D(p0, p4, 2, "rgb(255 0 0)");
                drawLineArrow2D(p0, p4, 2, "rgb(255 0 0)");
        
                const hi_1 = new float3(wi.x, 0, wi.z);
                const p5 = projectPointToScreen(hi_1, width, height, viewProjection);
                drawLine2D(p3, p5, 2, "rgb(255 255 255)");
                drawText(new float2(p5.x + 8, p5.y + 16), "hi,2", "rgb(255 255 255)", undefined, "left");
                drawCircle(p5, 5, "rgb(255 255 255)");

                drawText(p2.add(normalize(p2.sub(p0)).mul(16)), "w'", "rgb(50 50 255)",  "bold 24px monospace", "center");
                // drawLine2D(p0, p5, 2, "rgb(255 255 255)");
                drawLineArrow2D(p0, p2, 3, "rgb(50 50 255)");

                const ht_2 = new float3(wr.x, 0, wr.z);
                const p6 = projectPointToScreen(ht_2, width, height, viewProjection);
                drawLine2D(p4, p6, 2, "rgb(255 0 0)");
                drawText(new float2(p4.x - 16, p4.y + 16), "vr,2", "rgb(255 255 255)", undefined, "center");
                drawText(new float2(p6.x + 16, p6.y + 16), "hr,2", "rgb(255 255 255)", undefined, "left");
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
