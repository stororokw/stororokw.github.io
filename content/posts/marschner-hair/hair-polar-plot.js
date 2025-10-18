import {float2, float3, float4, mat4x4, mul, dot, Camera, OrthonormalBasis, OrthographicCamera, 
    normalize, degToRad, radToDeg, Ray, Cylinder, Plane, 
    refract, negative, projectToPlane, reflect, CylinderY,clamp,
    project} from "./math.js"

    
const canvas = document.querySelector('.hair-polar-plot');
let width = canvas.width = Math.min(innerWidth, 512);
let height = canvas.height = Math.min(innerWidth, 256);


let clearColor = "#2b2b2b";
const ctx = canvas.getContext('2d');

const thetaPicker = document.querySelector('#hair-polar-plot-theta');
const alphaRPicker = document.querySelector('#hair-polar-plot-alpha-r');
const betaRPicker = document.querySelector('#hair-polar-plot-beta-r');
const sigmaAPickerRedChannel = document.querySelector('#hair-polar-plot-sigmaA0');
const sigmaAPickerGreenChannel = document.querySelector('#hair-polar-plot-sigmaA1');
const sigmaAPickerBlueChannel = document.querySelector('#hair-polar-plot-sigmaA2');

let theta = degToRad(thetaPicker.value);
let phi = 0;
let alphaR = degToRad(alphaRPicker.value);
let betaR = degToRad(betaRPicker.value);
let sigmaA = new float3(Number(sigmaAPickerRedChannel.value), Number(sigmaAPickerGreenChannel.value), Number(sigmaAPickerBlueChannel.value));
    let aspectRatio = width / height;


const output = document.querySelector('.hair-polar-plot-theta');
const output3 = document.querySelector('.hair-polar-plot-alpha-r');
const output4 = document.querySelector('.hair-polar-plot-beta-r');

const output5 = document.querySelector('.hair-polar-plot-sigmaA0');
const output6 = document.querySelector('.hair-polar-plot-sigmaA1');
const output7 = document.querySelector('.hair-polar-plot-sigmaA2');

const resetButton = document.querySelector('#hair-polar-plot-reset');

thetaPicker.addEventListener('input', () => {
    output.textContent = thetaPicker.value + "°";
    theta = degToRad(clamp(thetaPicker.value, -89.4, 89.4));
});

alphaRPicker.addEventListener('input', () => {
    output3.textContent = alphaRPicker.value + "°";
    alphaR = degToRad(alphaRPicker.value);

});

betaRPicker.addEventListener('input', () => {
    output4.textContent = betaRPicker.value +"°";
    betaR = degToRad(betaRPicker.value);

});

sigmaAPickerRedChannel.addEventListener('input', () => {
    output5.textContent = sigmaAPickerRedChannel.value;
    sigmaA.x = Number(sigmaAPickerRedChannel.value);
});

sigmaAPickerGreenChannel.addEventListener('input', () => {
    output6.textContent = sigmaAPickerGreenChannel.value;
    sigmaA.y = Number(sigmaAPickerGreenChannel.value);
});

sigmaAPickerBlueChannel.addEventListener('input', () => {
    output7.textContent = sigmaAPickerBlueChannel.value;
    sigmaA.z = Number(sigmaAPickerBlueChannel.value);
});

function resizeCanvas()
{
    width = canvas.width = Math.min(innerWidth, 512);
    height = canvas.height = Math.min(innerWidth, 256);
    camera.aspectRatio = width / height;
    aspectRatio = width / height;
    camera.height = camera.width / aspectRatio;
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

resetButton.addEventListener("click", () => {
    camera.distance = 0.105;
    camera.focus.y = 1;
    camera.movement.y = 58;
    camera.movement.x = 0;
    camera.movement.z = 0;
    camera.focus.x = 0;
});


let camera = new OrthographicCamera(25, 25 / aspectRatio, 0.1, 1000);
camera.distance = 0.105;
camera.focus.y = 1;
camera.movement.y = 58;
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

    if(isRightMouseDown)
    {
        camera.distance += (dy * dt * 0.0001);
        camera.distance = Math.max(camera.distance, 0.01);

    }
    if(isLeftMouseDown)
    {

        camera.movement.x = -dx * dt * 0.01;
        camera.movement.y = dy * dt * 0.01; 
    }

    camera.update(dt);

}

camera.update(0);

function sign(x)
{
    let val = x > 0;
    return val - (x < 0);
}

function Fresnel(f0, u)
{
    return f0 + (1-f0) * Math.pow(1-u, 5);
}

function fresnel(cosThetaI, extIOR, intIOR)
{
    let etaI = extIOR;
    let etaT = intIOR;

    if (extIOR == intIOR)
    {
        return 0.0;
    }

    /* Swap the indices of refraction if the interaction starts
        at the inside of the object */
    if (cosThetaI < 0.0)
    {
        let temp = etaI;
        etaI = etaT;
        etaT = temp;
        cosThetaI = -cosThetaI;
    }

    /* Using Snell's law, calculate the squared sine of the
        angle between the normal and the transmitted ray */
    let eta = etaI / etaT;
    let sinThetaTSqr = eta * eta * (1 - cosThetaI * cosThetaI);

    if (sinThetaTSqr > 1.0)
    {
        return 1.0; /* Total internal reflection! */
    }

    let cosThetaT = Math.sqrt(1.0 - sinThetaTSqr);

    let Rs = (etaI * cosThetaI - etaT * cosThetaT)
        / (etaI * cosThetaI + etaT * cosThetaT);
    let Rp = (etaT * cosThetaI - etaI * cosThetaT)
        / (etaT * cosThetaI + etaI * cosThetaT);

    return (Rs * Rs + Rp * Rp) / 2.0;
}

function sqr(x )
{
    return x*x;
}

function Gaussian(beta, x, alpha)
{
    return (1.0 / (beta * Math.sqrt(2 * Math.PI))) * Math.exp(-(0.5 * sqr((x - alpha) / beta)));
}

function PhiD(p, gammaI, gammaT)
{
    return 2 * p * gammaT - 2 * gammaI + p * Math.PI;
}

function T(/*float*/ sigmaA, /*float*/ gammaT)
{
    return new float3(Math.exp(-2 * sigmaA.x * Math.cos(gammaT)), Math.exp(-2 * sigmaA.y * Math.cos(gammaT)), Math.exp(-2 * sigmaA.z * Math.cos(gammaT)));
}

function T1(/*float*/ sigmaA, /*float*/ gammaT, cosThetaT)
{
    return new float3(Math.exp(-2 * sigmaA.x * Math.cos(gammaT) / cosThetaT), Math.exp(-2 * sigmaA.y * Math.cos(gammaT)/ cosThetaT), Math.exp(-2 * sigmaA.z * Math.cos(gammaT)/ cosThetaT));
}

function SchlickBRDF( L, V, N, X, Y )
{
    let f0 = parameter;
    let H = normalize(L.add(V));
    return Fresnel(f0, dot(H,L));
}

// Phong BRDF
function BRDF(L, V, N, X, Y )
{
    let R = reflect(L,N);
    let n = 16;
    return Math.pow(Math.max(0, dot(R,V)), n);
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

function drawCircle(position, radius = 5, style = "white")
{
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(position.x, position.y, radius, degToRad(0), degToRad(360), false);
    ctx.fill();   
}

function drawText(p, text, color = "white", font = "14px monospace", align = "center")
{
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, p.x, p.y);
}

function draw()
{
    let currentTick = performance.now();
    dt = currentTick - previousTick;
    previousTick = currentTick;
 
    update(dt);
    let DiagramScaleInPixels = 32;

    let viewProjection = mul(camera.view, camera.projection);
    ctx.fillStyle = clearColor;
    ctx.fillRect(0, 0, width, height);

    // Draw Axes
    ctx.strokeStyle = "white";
    drawLine(new float3(-width * 0.25, 0, 0), new float3(width * 0.25, 0, 0), camera);

    // Draw arc thetaR
    {
        let inc = degToRad(-25) / 360.;
        let angle = degToRad(-50);
        let vertices = [];
        for (let i = 0; i <= 360; i++)
        {
            let v = new float3(DiagramScaleInPixels * Math.cos(angle + Math.PI / 2) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle + Math.PI / 2) * Math.sqrt(10), 0);

            if (i == 360)
            {
                let p1 = projectPointToScreen(v, width, height, viewProjection);
                let p0 = vertices[vertices.length - 1];
                drawArrowHead(p0, p1, 4);

            }
            if (i == 360)
            {
                let p0 = vertices[vertices.length - 1];
                let p1 = projectPointToScreen(v, width, height, viewProjection);
                drawText(p1.add(new float2(5, 0)), "θ_R", undefined, undefined, "left");
            }
            vertices.push(projectPointToScreen(v, width, height, viewProjection));
            angle += inc;

        }
                ctx.strokeStyle = "rgb(255 255 255 / 100%)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for(let i = 0; i < vertices.length; ++i)
        {
            const p = vertices[i];
            if(i == 0)
            {
                ctx.moveTo(p.x, p.y);
            }
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    // Draw Semi Cricle  10
    {

        let inc = 3.14159265 / 360.;
        let angle = 0.0;
        let vertices = [];
        for(let i = 0; i < 360; ++i)
        {
            let v = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(10.0), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(10.0), 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            vertices.push(point);
            angle += inc;
        }
        ctx.save();
        ctx.strokeStyle = "rgb(255 255 255 / 75%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i = 0; i < vertices.length; ++i)
        {
            const p = vertices[i];
            if(i == 0)
            {
                ctx.moveTo(p.x, p.y);
            }
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();

        // label
        {
            let v = new float3(-2, DiagramScaleInPixels * Math.sqrt(10) - 4, 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            drawText(point, "10", undefined, undefined, "right");
        }
    }

    // Draw Hemisphere Lines 10
    {
        let inc = 3.14159265 / 360.;
        for (let j = 1; j < 5; ++j)
        {
            let angle = 0.0;
            let vertices = [];

            for (let i = 0; i <= 360; i++)
            {
                let v = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(5 + j), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(5 + j), 0);
                let point = projectPointToScreen(v, width, height, viewProjection);
                vertices.push(point);
                angle += inc;
            }
                ctx.save();
                ctx.strokeStyle = "rgb(255 255 255 / 25%)";
                ctx.lineWidth = 2;
                ctx.setLineDash([10]);

                ctx.beginPath();
                for(let i = 0; i < vertices.length; ++i)
                {
                    const p = vertices[i];
                    if(i == 0)
                    {
                        ctx.moveTo(p.x, p.y);
                    }
                    ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
                ctx.restore();

        }
    }

    // Draw Semi Cricle 5
    {
        let inc = 3.14159265 / 360.;
        let angle = 0.0;
        let vertices = [];
        for (let i = 0; i <= 360; i++)
        {
            let v = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(5), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(5), 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            vertices.push(point);
            angle += inc;
        }
        ctx.strokeStyle = "rgb(255 255 255 / 50%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i = 0; i < vertices.length; ++i)
        {
            const p = vertices[i];
            if(i == 0)
            {
                ctx.moveTo(p.x, p.y);
            }
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        {
            let v = new float3(-2, DiagramScaleInPixels * Math.sqrt(5) - 4, 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            drawText(point, "5", undefined, undefined, "right");
        }
    }

    // Draw Hemisphere Lines 5
    {
        let inc = 3.14159265 / 360.;
        for (let j = 1; j < 4; ++j)
        {
            let angle = 0.0;
            let vertices = [];

            for (let i = 0; i <= 360; i++)
            {
                let v = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(1 + j), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(1 + j), 0);
                let point = projectPointToScreen(v, width, height, viewProjection);
                vertices.push(point);
                angle += inc;
            }
                ctx.save();
                ctx.strokeStyle = "rgb(255 255 255 / 25%)";
                ctx.lineWidth = 2;
                ctx.setLineDash([10]);
                ctx.beginPath();
                for(let i = 0; i < vertices.length; ++i)
                {
                    const p = vertices[i];
                    if(i == 0)
                    {
                        ctx.moveTo(p.x, p.y);
                    }
                    ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
                ctx.restore();

        }
    }

    // Draw Semi Cricle 1
    {
        let inc = 3.14159265 / 360.;
        let angle = 0.0;
        let vertices = [];

        // 1
        for (let i = 0; i <= 360; i++)
        {
            let v = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(1), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(1), 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            vertices.push(point);
            angle += inc;
        }

        // 0.5
        angle = 0.0;
        for (let i = 0; i <= 360; i++)
        {
            let v = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(0.5), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(0.5), 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            vertices.push(point);
            angle += inc;
        }

        // 0.1
        angle = 0.0;
        for (let i = 0; i <= 360; i++)
        {
            let v = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(0.1), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(0.1), 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            vertices.push(point);
            angle += inc;
        }
        

        ctx.strokeStyle = "rgb(255 255 255 / 50%)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i = 0; i < vertices.length; ++i)
        {
            const p = vertices[i];
            if(i == 0)
            {
                ctx.moveTo(p.x, p.y);
            }
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        {
            let v = new float3(-2, DiagramScaleInPixels * Math.sqrt(1) - 4, 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            drawText(point, "1", undefined, undefined, "right");
        }

        {
            let v = new float3(-2, DiagramScaleInPixels * Math.sqrt(0.5) - 4, 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            drawText(point, ".5", undefined, undefined, "right");
        }

        {
            let v = new float3(-2, DiagramScaleInPixels * Math.sqrt(0.1) - 4, 0);
            let point = projectPointToScreen(v, width, height, viewProjection);
            drawText(point, ".1", undefined, undefined, "right");
        }
    }


    // incident angle thetaI
    {
        let L = new float3();
        L.x = Math.sin(theta) * Math.cos(phi);
        L.y = Math.sin(theta) * Math.sin(phi);
        L.z = Math.cos(theta);
        L = normalize(L);

        let sinTheta = Math.sqrt(1 - Math.cos(theta) * Math.cos(theta));
        let v = new float3(0, 0, 0);
        let p0 = projectPointToScreen(v, width, height, viewProjection);

        let v1 = new float3(DiagramScaleInPixels * Math.cos(theta + Math.PI / 2) * Math.sqrt(12.5), DiagramScaleInPixels * Math.sin(theta + Math.PI / 2) * Math.sqrt(12.5), 0);
        let p1 = projectPointToScreen(v1, width, height, viewProjection);
        drawLine(v, v1, camera, 2);
        {
            let n0 = normalize(new float2(p1.x - p0.x, p1.y - p0.y));
            drawLineArrow2D(p0, p1, 2);                    
            drawText(new float2(p1.x + n0.x * 8, p1.y + n0.y * 4), "wi");
        }
    }

    // normal vector
    {
        let v0 = new float3(0, 0, 0);
        let v1 = new float3(0, DiagramScaleInPixels * Math.sqrt(10), 0);
        drawLine(v0, v1, camera, 2);
    }

    // draw degree lines
    {
        let v = new float3(0, 0, 0);
        let p0 = projectPointToScreen(v, width, height, viewProjection);

        // -30
        let angle = degToRad(30);
        let v1 = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(10), 0);
        let p1 = projectPointToScreen(v1, width, height, viewProjection);
        drawLine2D(p0, p1, 2, "rgb(255 255 255 / 25%");

        // 60
        angle = degToRad(60);
        v1 = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(10), 0);
        p1 = projectPointToScreen(v1, width, height, viewProjection);
        drawLine2D(p0, p1, 2, "rgb(255 255 255 / 25%");

        // 60
        angle = degToRad(-30 + 180);
        v1 = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(10), 0);
        p1 = projectPointToScreen(v1, width, height, viewProjection);
        drawLine2D(p0, p1, 2, "rgb(255 255 255 / 25%");

        // 30
        angle = degToRad(-60 + 180);
        v1 = new float3(DiagramScaleInPixels * Math.cos(angle) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle) * Math.sqrt(10), 0);
        p1 = projectPointToScreen(v1, width, height, viewProjection);
        drawLine2D(p0, p1, 2, "rgb(255 255 255 / 25%");

        {
            angle = degToRad(-30);
            let v = new float3(DiagramScaleInPixels * Math.cos(angle + Math.PI/2) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle + Math.PI / 2) * Math.sqrt(10), 0);
            v.x += 2;
            v.y += 2;
            let p0 = projectPointToScreen(v, width, height, viewProjection);
            drawText(p0, "-30");
        }

        {
            angle = degToRad(-60);
            let v = new float3(DiagramScaleInPixels * Math.cos(angle + Math.PI/2) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle + Math.PI / 2) * Math.sqrt(10), 0);
            v.x += 2;
            v.y += 2;
            let p0 = projectPointToScreen(v, width, height, viewProjection);
            drawText(p0, "-60");
        }

        {
            angle = degToRad(30);
            let v = new float3(DiagramScaleInPixels * Math.cos(angle + Math.PI/2) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle + Math.PI / 2) * Math.sqrt(10), 0);
            v.x -= 4;
            v.y += 2;
            let p0 = projectPointToScreen(v, width, height, viewProjection);
            drawText(p0, "30");
        }

        {
            angle = degToRad(60);
            let v = new float3(DiagramScaleInPixels * Math.cos(angle + Math.PI/2) * Math.sqrt(10), DiagramScaleInPixels * Math.sin(angle + Math.PI / 2) * Math.sqrt(10), 0);
            v.x -= 4;
            v.y += 2;
            let p0 = projectPointToScreen(v, width, height, viewProjection);
            drawText(p0, "60");
        }

        // reflection vector
        {
            let L = negative(normalize(new float3(Math.cos(theta + Math.PI / 2), Math.sin(theta + Math.PI / 2), 0)));
            let N = new float3(0, 1, 0);
            let R = N.mul(-2 * dot(L, N)).add(L);
            let v = new float3(0, 0, 0);

            let p0 = projectPointToScreen(v, width, height, viewProjection);
            let v1 = new float3(DiagramScaleInPixels * Math.sqrt(12.5) * R.x, DiagramScaleInPixels * Math.sqrt(12.5) * R.y, 0);

            let p1 = projectPointToScreen(v1, width, height, viewProjection);
            drawLineArrow2D(p0, p1, 2, "rgb(0 255 255 / 100%)");
            {
                let n0 = normalize(new float2(p1.x - p0.x, p1.y - p0.y));
                drawText(new float2(p1.x + n0.x * 8, p1.y + n0.y * 4), "R", "rgb(0 255 255 / 100%)");
            }
        }

            
        let maxR = 0.0;
        let r = 0.0;
        
        // draw brdf
        {
            let L = new float3();
            L.x = Math.sin(theta) * Math.cos(phi);
            L.y = Math.sin(theta) * Math.sin(phi);
            L.z = Math.cos(theta);
            L = normalize(L);

            let points = [];
            let points1 = [];
            let points2 = [];
            let inc = Math.PI / 256;
            let angle = 0.0;

            for (let i = 0; i <= 256; i++)
            {
                let V = normalize(new float3(Math.sin(angle - Math.PI / 2) * Math.cos(phi), Math.sin(angle - Math.PI / 2) * Math.sin(phi), Math.cos(angle - Math.PI / 2)));

                let eta = 1.55;

                let H = normalize(L.add(V));
                
                let basis = OrthonormalBasis.fromU(new float3(1, 0, 0));
                let wo = basis.toLocal(V);
                let wi = basis.toLocal(L);

                let sinThetaO = wo.x;
                let cosThetaO = Math.sqrt(1 - sinThetaO * sinThetaO);

                let sinThetaI = wi.x;
                let cosThetaI = Math.sqrt(1 - sinThetaI * sinThetaI);

                let thetaI = Math.asin(sinThetaI);
                let thetaO = Math.asin(sinThetaO);

                let thetaH = (thetaO + thetaI) * 0.5;
                let thetaD = (thetaO - thetaI) * 0.5;
                let sinThetaD = Math.sin(thetaD);
                let cosThetaD = Math.cos(thetaD);

                let phiI = Math.atan2(wi.z, wi.y);
                let phiO = Math.atan2(wo.z, wo.y);
                let phiD = phiO - phiI;

                let cosPhi = Math.cos(phiD);

                let h = Math.sin(theta);
                let sinGammaI = h;
                let cosGammaI = Math.sqrt(1 - sinGammaI * sinGammaI);
                let etaP = Math.sqrt(eta * eta - sinThetaI * sinThetaI) / cosThetaI;
                let gammaI = Math.asin(sinGammaI);
                let gammaT = Math.asin(h / etaP);

                let sinThetaT = sinThetaO / eta;
                let cosThetaT = Math.sqrt(1 - sinThetaT * sinThetaT);

                let alphaTT = -alphaR / 2;
                let betaTT = betaR / 2;
                let alphaTRT = -3 * alphaR / 2;
                let betaTRT = 2 * betaR;

                let M_p0 = Gaussian(betaR, thetaH, -alphaR);
                let M_p1 = Gaussian(betaTT, thetaH, alphaTT);
                let M_p2 = Gaussian(betaTRT, thetaH, alphaTRT);

                let phi0 = PhiD(0, gammaI, gammaT);
                let h_p0 = Math.sin(-phi0 / 2);
                let dPhidH_p0 = 2 / Math.sqrt(1 - h_p0 * h_p0);
                let N_p0 = 1 / (Math.abs(2 * dPhidH_p0));
                let A_p0 = fresnel(Math.cos(gammaT), 1, etaP);
                
                let a = 1 / etaP;
                let phi1 = PhiD(1, gammaI, gammaT);
                let h_p1 = sign(phi1) * Math.cos(phi1 / 2) / Math.sqrt(1 + a * a - 2 * a * sign(phi1) * Math.sin(phi1 / 2));
                let dPhidH_p1 = 2 / (Math.sqrt(1 - h_p1 * h_p1)) - 2 / (etaP * Math.sqrt(1 - Math.pow(h_p1 / etaP, 2)));
                let N_p1 = 1 / (Math.abs(2 * dPhidH_p1));
                let gammaTT = (h_p1 / etaP);
                let A_p1 = T(sigmaA, gammaTT, cosThetaT).mul(Math.pow(1 - fresnel(Math.cos(gammaTT), 1, etaP), 2.0));

                let h_p2 = 0.5;
                let gammaTRT = Math.asin(h_p2/ etaP);
                let dPhidH_p2 = (2 / Math.sqrt(1 - h_p2 * h_p2)) - (4 / (etaP * Math.sqrt(1 - Math.pow(h_p2 / etaP, 2))));
                let N_p2 = 1 / (Math.abs(2 * dPhidH_p2));

                let A_p2 = T1(sigmaA, gammaTRT, cosThetaT);
                A_p2.x *= A_p2.x;
                A_p2.y *= A_p2.y;
                A_p2.z *= A_p2.z;
                A_p2 = A_p2.mul(2 * Math.pow(1 - fresnel(Math.cos(gammaTRT), 1, etaP), 2.0) * Math.pow(fresnel(Math.cos(gammaTRT), 1, etaP), 1.0) );
                r = new float3(M_p0 * N_p0 * A_p0).add(A_p1.mul(M_p1 * N_p1).add(A_p2.mul(M_p2 * N_p2))).div(Math.pow(cosThetaD, 2));
                // r = new float3(M_p0 * N_p0 * A_p0).div(Math.pow(cosThetaD, 2));
                r.x = Math.sqrt(r.x);
                r.y = Math.sqrt(r.y);
                r.z = Math.sqrt(r.z);
                
                maxR = Math.max(Math.max(Math.max(maxR, r.x), r.y), r.z);
                points.push(new float2(r.x * Math.cos(angle), r.x * Math.sin(angle)));
                points1.push(new float2(r.y * Math.cos(angle), r.y * Math.sin(angle)));
                points2.push(new float2(r.z * Math.cos(angle), r.z * Math.sin(angle)));
                angle += inc;
            }
            
            let projectedPoints = [];
            let projectedPoints1 = [];
            let projectedPoints2 = [];
            maxR = 2;
            for (let i = 0; i < points.length; ++i)
            {
                let v = new float3(DiagramScaleInPixels * points[i].x / maxR * Math.sqrt(10), DiagramScaleInPixels * points[i].y / maxR * Math.sqrt(10), 0);
                let v1 = new float3(DiagramScaleInPixels * points1[i].x / maxR * Math.sqrt(10), DiagramScaleInPixels * points1[i].y / maxR * Math.sqrt(10), 0);
                let v2 = new float3(DiagramScaleInPixels * points2[i].x / maxR * Math.sqrt(10), DiagramScaleInPixels * points2[i].y / maxR * Math.sqrt(10), 0);
                projectedPoints.push(projectPointToScreen(v, width, height, viewProjection));
                projectedPoints1.push(projectPointToScreen(v1, width, height, viewProjection));
                projectedPoints2.push(projectPointToScreen(v2, width, height, viewProjection));
            }               

            ctx.strokeStyle = "rgb(0 255 0 / 75%)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for(let i = 0; i < projectedPoints1.length; ++i)
            {
                const p = projectedPoints1[i];
                if(i == 0)
                {
                    ctx.moveTo(p.x, p.y);
                }
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();

            ctx.strokeStyle = "rgb(0 0 255 / 75%)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for(let i = 0; i < projectedPoints2.length; ++i)
            {
                const p = projectedPoints2[i];
                if(i == 0)
                {
                    ctx.moveTo(p.x, p.y);
                }
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
                        ctx.strokeStyle = "rgb(255 0 0 / 75%)";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for(let i = 0; i < projectedPoints.length; ++i)
            {
                const p = projectedPoints[i];
                if(i == 0)
                {
                    ctx.moveTo(p.x, p.y);
                }
                ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();

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