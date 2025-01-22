import {float2, float3, float4, mat3x3, mat4x4, mul, dot, Camera, OrthographicCamera, OrthonormalBasis, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, distance,
    reflect, refract, negative, projectToPlane, clamp,
    project} from "./math.js"

const canvas = document.querySelector('.canvasHCaustic');
let width = canvas.width =  Math.min(innerWidth, 512);
let height = canvas.height =  Math.min(innerWidth, 512);

const ctx = canvas.getContext('2d');

const thetaPicker = document.querySelector('#h-caustic-theta');
const testerPicker = document.querySelector('#h-caustic-gamma');
const iorSlider = document.querySelector('#h-caustic-ior');
const testSlider = document.querySelector('#h-caustic-test');
const radioButtons = document.querySelectorAll('input[name="caustic-roots"]');

const colorPicker = document.querySelector('input[type="color"]');
const output = document.querySelector('.h-caustic-theta');
const output1 = document.querySelector('.h-caustic-ior');
// const output2 = document.querySelector('.h-caustic-gamma');
// let clearColor = "black";
let clearColor = "#2b2b2b";

let theta = degToRad(thetaPicker.value);
// let gamma = degToRad(testerPicker.value);
let gamma = 0;
let ior = iorSlider.value;
let causticRoot = document.querySelector('input[name="caustic-roots"]:checked').value;

thetaPicker.addEventListener('input', () => {
    output.textContent = thetaPicker.value;
    theta = degToRad(thetaPicker.value);
});

iorSlider.addEventListener('input', () => {
    output1.textContent = iorSlider.value;
    ior = iorSlider.value;
});

// testerPicker.addEventListener('input', () => {
//     output2.textContent = testerPicker.value;
//     gamma = degToRad(testerPicker.value);

// });

radioButtons.forEach((radioButton) =>
{
    radioButton.addEventListener('input', () => {
        causticRoot = radioButton.value;
    });
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
    if(isLeftMouseDown)
    {

        gamma += 0.5 * dx * dt / 1000.0;
        gamma = clamp(gamma, -Math.PI/2 + 1e-3, Math.PI/2 - 1e-3);
    }

    // camera.fudge1 = radToDeg(testValue);
    camera.fudge1 = radToDeg(0);
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
    ctx.save();
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


function drawText(p, text, color = "white", font = "16px monospace")
{
    ctx.font = font;
    ctx.fillStyle = color;
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

    let viewProjection = mul(camera.view, camera.projection);
    let world = mat4x4.identity();
    let worldViewProjection = mul(world, viewProjection);
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, width, height);

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
        ctx.strokeStyle = `rgb(255 255 255)`;

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
    if(0)
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
    const numberOfRays = 16;
    // const hairIOR = 1.33;
    const hairIOR = ior;
    // draw axes
    const x_axis = new float3(1, 0, 0);
    const y_axis = new float3(0, 1, 0);
    const transformed_x_axis = normalize(mul(x_axis, viewProjection));
    const transformed_y_axis = normalize(mul(y_axis, viewProjection));
    let canvasPos = new float2(0, 0);
    const p00 = new float2(canvasPos.x + 50, canvasPos.y + height - 50);
    drawLine2D(new float2(p00.x, p00.y), new float2(p00.x + 50 * transformed_x_axis.x, p00.y + 50 * transformed_x_axis.y), 2, "red");
    drawLine2D(new float2(p00.x, p00.y), new float2 (p00.x - 50 * transformed_y_axis.x, p00.y - 50 * transformed_y_axis.y), 2, "green");

    // draw theta
    drawText(new float2(16, 16), `  θ: ${radToDeg(theta).toFixed(0)}°`, "white");
    drawText(new float2(16, 32), `ior: ${hairIOR}`, "white");

    for (let j = 0; j <= numberOfRays; ++j)
    {
        let h = (j / (numberOfRays - 1));
        //float h = (j / (float)(numberOfRays));
        let sinGammaI = h;
        let gammaI = Math.asin(h);
        const isCausticRay = j == numberOfRays;
        if (isCausticRay)
        {
            // const etaP = Math.sqrt(hairIOR * hairIOR - Math.sin(theta) * Math.sin(theta)) / Math.cos(theta);
            const etaP = 1.33;
            h = Math.sqrt((4 - (etaP * etaP)) / 3);
            if(causticRoot === "root2")
            {
                h = -h; 
            }
            //h = mH;
            sinGammaI = h;
            gammaI = Math.asin(h);
            // gammaI = Math.acos((2 * Math.sqrt(1 + etaP * etaP)) / (Math.sqrt(3) * etaP));
        }
        // let gammaI = testValue;
        // let h = Math.sin(gammaI);
        const cosGammaI = Math.cos(gammaI);
        let dir = new float3(1, 0, 0);
        let world = mat4x4.rotateZ(gammaI);
        let viewProjection = mul(mat4x4.rotateZ(-gammaI), mul(camera.view, camera.projection));
        const magot = dir.mul(world);
        const tangent = new float2(-magot.y, magot.x);
        const circleCenter = new float3(0, 0, 0);
        const circleScreenPosition = new float3(0, 0);

        let p0 = projectPointToScreen(circleCenter, width, height, worldViewProjection);
        const intersectionPoint = new float2(circleScreenPosition.x + tangent.x * h - cosGammaI * magot.x, circleScreenPosition.x + tangent.y * h - cosGammaI * magot.y);

        const p2 = projectPointToScreen(intersectionPoint, width, height, viewProjection);
        
        // drawCircle(p0, 5, "white");
        // drawCircle(p2, 5, "red");
        
        const startLine = new float2(circleScreenPosition.x, circleScreenPosition.y);
        const endLine = projectPointToScreen(new float2(circleScreenPosition.x + tangent.x * h, circleScreenPosition.y + tangent.y * h), width, height, viewProjection);
        
        const normal = normalize(new float2((intersectionPoint.x - circleScreenPosition.x), (intersectionPoint.y - circleScreenPosition.y)));
        const endNormal = projectPointToScreen(new float2(circleScreenPosition.x + magot.x, circleScreenPosition.y + magot.y), width, height, viewProjection);
    
        // draw h
        if(isCausticRay)
        {
            drawLine2D(p0, endLine, 3, "yellow");
            // drawLine2D(p0, endNormal, 3, "red");

        }

        const hTextPos = projectPointToScreen(new float2(circleScreenPosition.x + tangent.x * h * 0.5 + magot.x * 0.05, circleScreenPosition.y + tangent.y * h * 0.5 + magot.y * 0.05),
        width, height, viewProjection);
        if(isCausticRay)
        {
            // drawText(hTextPos, `h: ${h.toFixed(1)}`, "yellow");
            drawText(new float2(hTextPos.x, hTextPos.y + 16), `h: ${h.toFixed(1)}`, "yellow");
        }

        if(isCausticRay)
        {
            const p0 = projectPointToScreen(intersectionPoint, width, height, viewProjection);
            const p2 = projectPointToScreen(new float2(circleScreenPosition.x + tangent.x * h, circleScreenPosition.y + tangent.y * h), width, height, viewProjection);
            drawLine2D(p0, p2, 2, "white", [5,7]);
        }

        {
            const v = new float3(normal.x, normal.y, 0);
            const direction = mul(v, world);

            // draw wi
            const pp = new float2(intersectionPoint.x + direction.x * 0.5, intersectionPoint.y + direction.y * 0.5);
            const p3 = projectPointToScreen(pp, width, height, viewProjection);
            drawLine2D(p2, p3, isCausticRay ? 3 : 2, isCausticRay ? "rgb(255 255 0 / 100%)" : "rgb(255 255 255 / 50%)");

            // draw normal to intersection
            const pp1 = new float2(intersectionPoint.x + normal.x * 0.5, intersectionPoint.y + normal.y * 0.5);
            const p4 = projectPointToScreen(pp1, width, height, viewProjection);
            // drawLine2D(p2, p4, 2);
            if(isCausticRay)
            {
                 drawLine2D(p2, p4, 3);
            }

            if(isCausticRay)
            {
                const p0 = projectPointToScreen(new float2(intersectionPoint.x, intersectionPoint.y), width, height, viewProjection);
                const p1 = projectPointToScreen(new float2(intersectionPoint.x + direction.x * 0.5, intersectionPoint.y + direction.y* 0.5), width, height, viewProjection);
                const n0 = normalize(new float2(p1.x - p0.x, p1.y - p0.y));
                const t0 = new float2(n0.y, -n0.x);
                const p2 = new float2(p1.x - 5 * t0.x - n0.x * 10, p1.y - 5 * t0.y - n0.y * 10);
                const p3 = new float2(p1.x + 5 * t0.x - n0.x * 10, p1.y + 5 * t0.y - n0.y * 10);
                ctx.fillStyle = isCausticRay ? "rgb(255 255 0 / 100%)" : "rgb(255 255 255 / 50%)";
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.fill();

                drawText(new float2(p1.x + n0.x * 20, p1.y + n0.y + 5), "wi", "yellow");
            }

            // draw angle between normal and wi
            if(isCausticRay)
            {
                const angle = Math.atan2(direction.y, direction.x);
                let angle1 = Math.atan2(normal.y , normal.x) - angle;
                const offset = ((new float2(direction.x, direction.y).mul(0.5)).add(normal.mul(0.5))).mul(0.3).add(intersectionPoint);
                const offsetP = projectPointToScreen(new float2(offset.x, offset.y), width, height, viewProjection);

                const intersection_projection = projectPointToScreen(new float2(intersectionPoint.x, intersectionPoint.y), width, height, viewProjection);
                ctx.save();
                ctx.textAlign = "right";

                ctx.beginPath();
                ctx.arc(intersection_projection.x, intersection_projection.y, 30, -angle + gammaI,  -angle + gammaI - angle1, (-angle + gammaI) < 0 ? true : false);
                ctx.stroke();	
                drawText(new float2(offsetP.x, offsetP.y), `${radToDeg(Math.acos(dot(new float2(direction.x, direction.y), normal))).toFixed(1)}°`);
                drawText(new float2(intersection_projection.x - 12, intersection_projection.y - 10), `γ`);
                ctx.restore();
            }

            const reflected_direction = reflect(direction, new float3(normal.x, normal.y, 0));
            const angle = Math.atan2(direction.y, direction.x);
            let angle1 = Math.atan2(reflected_direction.y , reflected_direction.x) - angle;


            const intersection_projection = projectPointToScreen(new float2(intersectionPoint.x, intersectionPoint.y), width, height, viewProjection);
            // ctx.beginPath();
            // ctx.arc(intersection_projection.x, intersection_projection.y, 25, -angle + gammaI,  -angle + gammaI - angle1, (-angle + gammaI) < 0 ? true : false);
            // ctx.stroke();


            // draw reflection vector
            {
                const pp = new float2(intersectionPoint.x + reflected_direction.x * 0.5, intersectionPoint.y + reflected_direction.y* 0.5);
                const p3 = projectPointToScreen(pp, width, height, viewProjection);

                drawLineArrow2D(p2, p3, 2, "rgb(255 0 0 / 50%)")
                // draw line from incident intersection point to center of circle
                // drawLine2D(p2, p0, 2, "white");
                // ctx.save();
                // ctx.textAlign = "center";
                // const n0 = normalize(new float2(pp.x - p0.x, pp.y - p0.y));
                // drawText(new float2(p3.x + n0.x, p3.y + n0.y + (p3.y > height /2 ? 10 : -10)), "R(p=0)");
                // ctx.restore();
                // draw angle text R
                {
                    const pp = new float2(intersectionPoint.x + reflected_direction.x * 0.3, intersectionPoint.y + reflected_direction.y * 0.3);
                    const pp1 = new float2(intersectionPoint.x + normal.x * 0.3, intersectionPoint.y + normal.y * 0.3);
                    const p = new float2((pp1.x + pp.x) * 0.5, (pp1.y + pp.y) * 0.5);
                    const textPosition = projectPointToScreen(p, width, height, viewProjection);
                    // ctx.save();
                    // ctx.textAlign = "center";
                    // drawText(new float2(textPosition.x, textPosition.y), "γi")
                    // ctx.restore();
                }
            }

        }

        //TT
        {
            // const eta = 1.55;
            const etaP = Math.sqrt(hairIOR * hairIOR - Math.sin(theta) * Math.sin(theta)) / Math.cos(theta);

            const gammaT = Math.asin(h / etaP);
            const dir = new float3(1, 0, 0);
            const v = new float3(-normal.x, -normal.y, 0);
            const world = mat4x4.rotateZ(gammaT);
            const direction = normalize(mul(v, world));

            const gammaTP = Math.asin(h / hairIOR);
            const refraction_direction_unmodified =normalize(mul(v, mat4x4.rotateZ(gammaTP))) ;
            
            // draw refracted angle sector
            {
                const angle = Math.atan2(direction.y, direction.x);
                let angle1 = Math.atan2(-normal.y, -normal.x) - angle;
                if (angle1 >= 3.14159250)
                {
                    angle1 -= 2 * Math.PI;
                }
                else if (angle1 <= -3.14159250)
                {
                    angle1 += 2 * Math.PI;
                }
                const intersection_projection = projectPointToScreen(new float2(intersectionPoint.x, intersectionPoint.y), width, height, viewProjection);
                // ctx.beginPath();
                // ctx.arc(intersection_projection.x, intersection_projection.y, 25, -angle + gammaI, -angle + gammaI - angle1, (-angle + gammaI) < 0 ? true : false);
                // ctx.stroke();

                const o = new float2(intersectionPoint.x, intersectionPoint.y);
                const d = new float2(direction.x, direction.y);
                const c = new float2(circleScreenPosition.x, circleScreenPosition.y);
                const t = dot(d, c.sub(o)) * 2;
                const p = o.add(d.mul(t));

                const normal1 = new float2((p.x - circleScreenPosition.x), (p.y - circleScreenPosition.y));
                const norm1 = Math.sqrt(normal1.x * normal1.x + normal1.y * normal1.y);
                normal1.x /= norm1;
                normal1.y /= norm1;

                const pos = new float2(circleScreenPosition.x + normal1.x, circleScreenPosition.y + normal1.y);
                const pppp = projectPointToScreen(pos, width, height, viewProjection);
                const intersectionPoint_projected = projectPointToScreen(intersectionPoint, width, height, viewProjection);
                // refracted intersection point
                // drawCircle(pppp, 5, "yellow");
                // draw line from R to TT
                drawLine2D(intersectionPoint_projected, pppp, isCausticRay ? 3 : 2, isCausticRay ? "rgb(255 255 0 / 100%)" : "rgb(255 255 255 / 50%)");

                // draw normal of refracted intersection point
                const startNormal = projectPointToScreen(new float2(p.x , p.y), width, height, viewProjection);
                const endNormal = projectPointToScreen(new float2(p.x + normal1.x * 0.5, p.y + normal1.y * 0.5),
                    width, height, viewProjection);
                // drawLine2D(startNormal, endNormal, 2);
                
                // TT
                const direction_refract = normalize(refract(normalize(new float3(direction.x, direction.y, 0)), normalize(new float3(-normal1.x, -normal1.y, 0)), etaP / 1));
                const pp = new float2(p.x + direction_refract.x * 0.5, p.y + direction_refract.y * 0.5);
                const refracted_pos0 = projectPointToScreen(new float2(p.x, p.y), width, height, viewProjection);
                const refracted_pos1 = projectPointToScreen(new float2(pp.x, pp.y), width, height, viewProjection);
                // drawLine2D(refracted_pos0, refracted_pos1, "red");

                // draw angle text TT
                {
                    // const pp = new float2(intersectionPoint.x + direction.x * 0.3, intersectionPoint.y + direction.y * 0.3);
                    // const pp1 = new float2(intersectionPoint.x - normal.x * 0.3, intersectionPoint.y - normal.y * 0.3);
                    // const p2 = new float2((pp1.x + pp.x) * 0.5, (pp1.y + pp.y) * 0.5);
                    // const textPosition = projectPointToScreen(p2, width, height, viewProjection);
                    // ctx.save();
                    // ctx.textAlign = "center";
                    // drawText(new float2(textPosition.x, textPosition.y), "γt");
                    // ctx.restore();
                }
                
                // draw angle text TT
                {
                    // const pp = new float2(p.x - direction.x * 0.3, p.y - direction.y * 0.3);
                    // const pp1 = new float2(p.x - normal1.x * 0.3, p.y - normal1.y * 0.3);
                    // const p2 = new float2((pp1.x + pp.x) * 0.5, (pp1.y + pp.y) * 0.5);
                    // const textPosition = projectPointToScreen(p2, width, height, viewProjection);
                    // ctx.save();
                    // ctx.textAlign = "center";
                    // drawText(new float2(textPosition.x, textPosition.y), "γt");
                    // ctx.restore();
                }

                // draw angle text TT
                {
                    // const pp = new float2(p.x + direction_refract.x * 0.3, p.y + direction_refract.y * 0.3);
                    // const pp1 = new float2(p.x + normal1.x * 0.3, p.y + normal1.y * 0.3);
                    // const p2 = new float2((pp1.x + pp.x) * 0.5, (pp1.y + pp.y) * 0.5);
                    // const textPosition = projectPointToScreen(p2, width, height, viewProjection);
                    // ctx.save();
                    // ctx.textAlign = "center";
                    // drawText(new float2(textPosition.x, textPosition.y), "γt");
                    // ctx.restore();
                }

                // draw TT vector
                {
                    const p0 = projectPointToScreen(new float2(p.x, p.y), width, height, viewProjection);
                    const p1 = projectPointToScreen(new float2(pp.x, pp.y), width, height, viewProjection);

                    drawLineArrow2D(p0, p1, 3, "rgb(0 255 0 / 50%)");
                    // ctx.save();
                    // ctx.textAlign = "left";
                    // const n0 = normalize(new float2(pp.x - p0.x, pp.y - p0.y));
                    // ctx.restore();
                }

                // TRT
                {
                    const v = new float3(-normal1.x, -normal1.y, 0);
                    const world = mat4x4.rotateZ(gammaT);
                    const direction = mul(v, world);

                    const o = new float2(p.x, p.y);
                    const d = new float2(direction.x, direction.y);
                    const c = new float2(circleScreenPosition.x, circleScreenPosition.y);
                    const t = dot(d, c.sub(o)) * 2;
                    const ppp = o.add(d.mul(t));

                    // drawLine2D(projectPointToScreen(circleScreenPosition, width, height, viewProjection), projectPointToScreen(ppp, width, height, viewProjection), 2);

                    // draw line from TT to TRT
                    drawLine2D(projectPointToScreen(p, width, height, viewProjection), projectPointToScreen(ppp, width, height, viewProjection), isCausticRay ? 3 : 2, isCausticRay ? "rgb(255 255 0 / 100%)" : "rgb(255 255 255 / 50%)");

                    {
                        const normal2 = new float2((ppp.x - circleScreenPosition.x), (ppp.y - circleScreenPosition.y));
                        const norm2 = Math.sqrt(normal2.x * normal2.x + normal2.y * normal2.y);
                        normal2.x /= norm2;
                        normal2.y /= norm2;
                    
                        // const endNormal = projectPointToScreen(new float2(circleScreenPosition.x + normal2.x * 0.5, circleScreenPosition.y + normal2.y * 0.5), width, height, viewProjection);
                        // drawLine2D(p0, endNormal, 25);
                    
                        // draw the refracted TRT out of the hair fiber vector 
                        const direction_refract = refract(new float3(direction.x, direction.y, 0), new float3(-normal2.x, -normal2.y, 0), etaP);
                        const pppp = new float2(ppp.x + direction_refract.x * 0.5, ppp.y + direction_refract.y * 0.5);
                        drawLineArrow2D(projectPointToScreen(ppp, width, height, viewProjection), projectPointToScreen(pppp, width, height, viewProjection), 3, isCausticRay ? "rgb(255 255 0 / 100%)" : "rgb(0 0 255 / 50%)");
                        const tt_intersection_ss = projectPointToScreen(ppp, width, height, viewProjection);
                        const trt_intersection_ss = projectPointToScreen(pppp, width, height, viewProjection);
                        const n0 = normalize(new float2(trt_intersection_ss.x - tt_intersection_ss.x, trt_intersection_ss.y - tt_intersection_ss.y));
                        // drawText(new float2(trt_intersection_ss.x + n0.x, trt_intersection_ss.y + n0.y + (trt_intersection_ss.y > height / 2 ? -16 : 16)), "TRT (p=2)");
                        
                        
                        
                    
                        // draw line at intersection in direction wi
                        if (isCausticRay)
                            {
                                let v = new float3(normal.x, normal.y, 0);
                                let world = mat4x4.rotateZ(gammaI);
    
                                const wi = mul(v, world);
    
                                const p0 = projectPointToScreen(new float2(ppp.x, ppp.y), width, height, viewProjection);
                                const p1 = projectPointToScreen(new float2(ppp.x + wi.x * 0.5, ppp.y + wi.y * 0.5), width, height, viewProjection);
                                drawLine2D(p0, p1, 3, "white");
                                {
                                    const n0 = normalize(new float2(p1.x - p0.x, p1.y - p0.y));
                                    const t0 = new float2(n0.y, -n0.x);
                                    const p2 = new float2(p1.x - 5 * t0.x - n0.x * 10, p1.y - 5 * t0.y - n0.y * 10);
                                    const p3 = new float2(p1.x + 5 * t0.x - n0.x * 10, p1.y + 5 * t0.y - n0.y * 10);
                                    ctx.fillStyle = "white";
                                    ctx.beginPath();
                                    ctx.moveTo(p1.x, p1.y);
                                    ctx.lineTo(p2.x, p2.y);
                                    ctx.lineTo(p3.x, p3.y);
                                    ctx.fill();
                                }

    
                                // draw angle sector
                                let angle = Math.atan2(direction_refract.y, direction_refract.x);
                                let angle1 = Math.atan2(wi.y, wi.x) - angle;
                                let a = -angle + gammaI;

                                const ppp_projected = projectPointToScreen(new float2(ppp.x, ppp.y), width, height, viewProjection);
                                ctx.beginPath();
                                ctx.arc(ppp_projected.x, ppp_projected.y, 25, a, a - angle1, ((angle - Math.atan2(wi.y, wi.x)) > Math.PI) || ((angle - Math.atan2(wi.y, wi.x)) < 0) ? true : false);
                                ctx.stroke();
                                
                                // draw angle text phiD
                                {
                                    const pp = new float2(ppp.x + wi.x * 0.5, ppp.y + wi.y * 0.5);
                                    const pp1 = new float2(ppp.x + direction_refract.x * 0.5, ppp.y + direction_refract.y * 0.5);
                                    const p = new float2((pp1.x + pp.x) * 0.5, (pp1.y + pp.y) * 0.5);
                                    const textPosition = projectPointToScreen(p, width, height, viewProjection);
                                    // drawText(textPosition, `Φ: ewqewqewq ${radToDeg(acos(dot(wi, direction_refract)))}`, "red", "25px monospace");
                                   
                                    drawText(new float2(textPosition.x, textPosition.y), `Φ ${radToDeg(Math.acos(dot(wi, direction_refract))).toFixed(0)}`);
                                }
                            }
                        continue;

                        // draw normal vector
                        {
                            const startNormal = projectPointToScreen(new float2(ppp.x, ppp.y), width, height, viewProjection);
                            const endNormal = projectPointToScreen(new float2(ppp.x + normal2.x * 0.5, ppp.y + normal2.y * 0.5), width, height, viewProjection);
                            drawLine2D(startNormal, endNormal, 2);
                        }

                        // draw inner angle sector
                        {
                            const angle = Math.atan2(-direction.y, -direction.x);
                            let angle1 = Math.atan2(-normal2.y, -normal2.x) - angle;
                            if (angle1 >= 3.14159250)
                            {
                                angle1 -= 2 * Math.PI;
                            }
                            else if (angle1 <= -3.14159250)
                            {
                                angle1 += 2 * Math.PI;
                            }
                            const ppp_projected = projectPointToScreen(new float2(ppp.x, ppp.y), width, height, viewProjection);
                            ctx.beginPath();
                            ctx.arc(ppp_projected.x, ppp_projected.y, 25, -angle + gammaI, -angle + gammaI - angle1, (-angle + gammaI) < 0 ? true : false);
                            ctx.stroke();
                        }
                        
                        // draw angle text TRT
                        {
                            const pp = new float2(ppp.x - normal2.x * 0.3, ppp.y - normal2.y * 0.3);
                            const pp1 = new float2(ppp.x - direction.x * 0.3, ppp.y - direction.y * 0.3);
                            const p = new float2((pp1.x + pp.x) * 0.5, (pp1.y + pp.y) * 0.5);
                            const textPosition = projectPointToScreen(p, width, height, viewProjection);
                            ctx.save();
                            ctx.textAlign = "center";
                            drawText(new float2(textPosition.x, textPosition.y), "γt");
                            ctx.restore();
                        }

                        // draw angle text TRT
                        {
                            const pp = new float2(ppp.x + normal2.x * 0.3, ppp.y + normal2.y * 0.3);
                            const pp1 = new float2(ppp.x + direction_refract.x * 0.3, ppp.y + direction_refract.y * 0.3);
                            const p2 = new float2((pp1.x + pp.x) * 0.5, (pp1.y + pp.y) * 0.5);
                            const textPosition = projectPointToScreen(p2, width, height, viewProjection);
                            ctx.save();
                            ctx.textAlign = "left";
                            drawText(new float2(textPosition.x - 8, textPosition.y), "γi");
                            ctx.restore();
                        }

                        // draw outer angle sector
                        {
                            const angle = Math.atan2(direction_refract.y, direction_refract.x);
                            let angle1 = Math.atan2(normal2.y, normal2.x) - angle;
                            if (angle1 >= 3.14159250)
                            {
                                angle1 -= 2 * Math.PI;
                            }
                            else if (angle1 <= -3.14159250)
                            {
                                angle1 += 2 * Math.PI;
                            }

                            const ppp_projected = projectPointToScreen(new float2(ppp.x, ppp.y), width, height, viewProjection);
                            ctx.beginPath();
                            ctx.arc(ppp_projected.x, ppp_projected.y, 25, -angle + gammaI, -angle + gammaI - angle1, (-angle + gammaI) < 0 ? false : true);
                            ctx.stroke();
                        }


                    }

                }
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
