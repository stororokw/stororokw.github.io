+++
date = '2024-12-06'
title = 'Marschner Hair Shading Model'
scripts = ["h-offset.js", "coordinate-frame.js", "bravais.js", "hcaustic.js", "loci-reflection.js", "loci-refraction.js", "hair-model.js", "reflection.js", "refraction.js", "path-length.js", "M-function-plot.js", "N-function-plot.js"]
toc = true
side = true
tags = ['hair', 'marschner', 'rendering']
bibliography = 'output.json'
[build]
  list = 'never'

+++

## Introduction

Strand-based hair rendering in games is starting to become a viable option thanks to a demand for better character rendering and talks given by game engine developers at various conferences on the topic of rendering hair. Also, old techniques that were once too slow, such as dual scattering {{<cite Zinke2008>}}, have now become usable today thanks to the ever-increasing power of new hardware.

This blog post will cover the Marschner hair shading model {{<cite Marschner2003>}}, an approach for shading hair that models the light scattering from a single hair fiber (single scattering) and therefore does not consider the light interactions between multiple hair fibers (multiple scattering). As a result, this shading model cannot represent light-colored hair where the overall appearance is due to multiple scattering. However, this approach is still important to learn and understand because it is the foundation for modern shading models.

{{<figure src="marschner-hair-preview.png" caption="A comparison between realtime hair shading using the Marschner model + dual scattering, and reference photos from {{<cite Karis2016>}}" align="center" width="800px" loading="lazy"/>}}

{{<info-box information>}}
    Many of the diagrams in this blog post are interactive. With some diagrams you can change the camera angle using <kbd>LMB</kbd> + <kbd>Drag</kbd>. The user interface below each diagram allows you to modify the parameters.
{{</info-box>}}

## The Hair Structure

Hair is a protein filament consisting of the hair root which is embedded beneath the skin and the shaft/fiber which consists of three layers:

{{<figure src="hair-anatomy.jpg" caption="The structure of a hair fiber" align="center" width="324px" loading="lazy"/>}}
 
### Cuticle

The cuticle is the outer shell of the hair and is made up of overlapping layers of **transparent** keratin cells arranged similar to that of roof tiles, and functions to retain moisture and protect the inner layers from damage.

{{<figure src="hair-cuticle.jpg" caption="The hair cuticle is made up of a overlapping cell structure protecting the hair fiber from damage." align="center" attr="<https://www.nisenet.org/catalog/scientific-image-sem-human-hair>" width="412px" height="auto"/>}}

### Cortex

The cortex makes up the bulk of the contents of the hair fiber and is mainly responsible for the hair color that we perceive. As the light refracts from the cuticle into the cortex some of the light will be absorbed and end up being a certain color depending on the amount of melanin pigments inside the cortex.

{{<figure src="hair-cortex-crosssection.png" caption="A cross section of a hair fiber. The black spots are the melanin granules." align="center" attr="<https://www.researchgate.net/figure/Transmission-Electron-micrograph-of-a-thin-transversal-cut-through-a-hairs-shaft-The_fig1_262270851>" width="412px" height="auto"/>}}

### Medulla

The medulla is the inner most layer of the hair fiber and contains a soft oily white substance. In human hair the medulla is largely absent or discontinuous along the fiber, and is more prominent in animal fur. The function of the medulla is still unknown.

{{<figure src="hair-stubble-20x.jpg" caption="Hairs from a stubble under magnification. The medulla is visible through the white transparent hairs." align="center" attr="<https://www.photomacrography.net/forum/viewtopic.php?f=27&t=44824>" width="860px" height="auto"/>}}

## The Appearance of Hair

This section covers some of the main visual characteristics of hair under direct lighting that will give a better understanding of what behavior the hair model should capture in order to give realistic results.

### Specular highlights

When the hair is lit from the front and viewed from the same side then there will be two specular highlights, a white specular highlight called the **primary highlight** and a colored highlight above called the **secondary highlight**.

{{<figure src="hair-appearance.png" caption="Hair with a white primary highlight and above is a orange secondary highlight caused by the tilt of the cuticles." align="center" attr="{{<cite Nagase2019>}}" width="300px" height="auto"/>}}

### Transmission

When the hair is backlit, lit from the back, and viewed from the opposite side, light must travel from the back of the hair through each hair strand, each time some light is absorbed, before finally reaching the front. This process produces brightly, colored lit hair and is called transmission because the light enters the hair fiber, travels all the way through, and exits (the light has been transmitted).

{{<figure src="hair-backlit-small.png" caption="Black hair backlit. The light has traveled from the back to the front side of the hair absorbing light as it passes through individual hair fibers causing strongly colored highlights. Note this mostly occurs at the edges because the light has been completely absorbed closer to the center." align="center" attr="{{<cite Karis2016>}}" height="auto"/>}}

## The Hair Fiber Model

The hair fiber model is based on the hair structure and is approximated by a transparent glass cylinder with a surface that is composed of rough, tilted scales representing the cuticle. The interior is a homogeneous absorbing medium representing the cortex. The model does not take into account the scattering due to the medulla.

### Geometric Optics

[Geometric/Ray optics](https://en.wikipedia.org/wiki/Geometrical_optics) can be used to model how the light interacts with the hair fiber using the approximation above. There are two types of light scattering events that can occur at the surface:

* Reflection: The angle the incoming light vector makes with the surface normal is the same as the angle the reflected vector makes with the surface normal.

{{<figure caption="Reflection">}}
    {{<group direction="row">}}
        {{<canvas class="hair-reflection" width="300px" height="300px" tabindex="0">}}
        {{<toolbox title="Reflection Debug">}}
            {{<toolbox-container>}}
                {{<toolbox-slider label="theta" id="hair-reflection-theta" min="0" max="90" defaultValue="30" unit="°">}}
            {{</toolbox-container>}}
        {{</toolbox>}}
    {{</group>}}
{{</figure>}}

* Refraction/Transmission: [Snell's law](https://en.wikipedia.org/wiki/Snell%27s_law) is used to determine the angle of the refracted ray when it passes from one medium to another. This is achieved by using the angle that the incoming light vector makes with the surface normal(incident angle) and the refractive indices of the two media. When light refracts into a medium with a higher index of refraction the angle of the refracted ray will be less than the incident angle thereby bending the ray closer to the normal.
@@@ \sin(\theta) \cdot \eta_1 = \sin(\beta) \cdot \eta_2 @@@

{{<figure caption="Refraction">}}
    {{<group direction="row">}}
        {{<canvas class="hair-refraction" width="320px" height="320px" tabindex="0">}}
        {{<toolbox title="Refraction Debug" width="100%">}}
            {{<toolbox-container>}}
                {{<toolbox-slider label="theta" id="hair-refraction-theta" min="0" max="90" defaultValue="30" unit="°">}}
                {{<toolbox-slider label="ior" id="hair-refraction-ior" min="1" max="1.8" defaultValue="1.55" step="0.01">}}
            {{</toolbox-container>}}
        {{</toolbox>}}
    {{</group>}}
{{</figure>}}

### Modes of Reflection

The first point to note in the figure below is that there are three light paths, referred to as modes of reflection, or components,  which depend on the order and number of scattering events along the path. These three modes are labelled **R**,  **TT**, and **TRT**. Where **R** represents reflection, and **T** stands for transmission.
- R component: The light ray is reflected when it hits the cuticle surface.
- TT component: The light ray refracts at the surface entering the hair fiber, travels in a straight line through the interior, and then refracts again as it exits the fiber.
- TRT component: This mode is similar to the TT component, but there is an internal reflection before the ray exits the fiber.

In the case of a smooth cylinder (tilt angle α = 0), the R, and TRT modes point in the same direction. This has the effect of only producing a white highlight and occurs in synthetic hair fibers. As the tilt angle is increased the TRT component is angled toward the tip. In contrast, the R component is angled toward the root, this explains why the secondary highlight is shifted above the primary highlight.

The TT, and TRT components are colored because the light ray enters the hair interior and is absorbed as it travels through the fiber, which depends on the absorption cross-section σ of the medium, and the index of refraction η.

The figure below illustrates the light scattering from a fiber using the hair model and geometric optics, helping to explain many of the observations made from the photographs in the previous section regarding the appearance of hair.

{{<figure caption="The hair fiber model shown in the longitudinal plane. The dashed vectors correspond to an alpha value of 0° (smooth cylinder).">}}
    {{<canvas class="hair-model" width="512" height="512" tabindex="0">}}
    {{<toolbox title="Hair Fiber Model Debug">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="alpha" id="hair-model-alpha" min="0" max="8" defaultValue="0" unit="°">}}
            <!-- {{<toolbox-slider label="theta" id="hair-model-theta" min="-90" max="-60" defaultValue="-70" unit="°">}} -->
            {{<toolbox-slider label="theta" id="hair-model-theta" min="0" max="45" defaultValue="20" unit="°">}}
            {{<toolbox-slider label="ior" id="hair-model-ior" min="1" max="1.8" defaultValue="1.55" step="0.01">}}
        {{</toolbox-container>}}
    {{</toolbox>}}
{{</figure>}}

## Hair Coordinate Frame

The hair coordinate frame represents the local coordinate system of the hair at a particular point along the fiber. The shading of the hair will be done in this local space because it is convenient.

The tangent vector, **u**, points along the length of the hair fiber going from root to the tip. The plane @@ u \times w @@ is called the longitudinal/incidence plane. The plane @@ v \times w @@ is called the azimuth/normal plane. Together the vectors **u**, **v**, and **w** create a right handed orthonormal basis (@@ u \times v = w @@).

The light direction is denoted @@ \omega_i @@, and the scattered light direction is @@ \omega_r @@. As a convention both vectors point away from the surface, and these directions are expressed in spherical coordinates on an unit sphere.

The incidence/longitudinal angles are measured from the normal plane and denoted by @@ \theta_i @@ and @@ \theta_r @@. 
- At 0° the vector will be perpendicular to the tangent and on the normal plane.
- At 90° the vector will point in the same direction as the tangent vector **u**.
- At -90° the vector will point in the opposite direction to the tangent vector, **-u**.

The azimuth angles are angles measured around the tangent vector **u** and are denoted by @@ \phi_i @@ and @@ \phi_r @@. 
- At 0° the vector will point in the same direction as **v**.
- At 90° the vector will point in the same direction as **w**.
- At 180° the vector will point in the opposite direction to the vector **v**.

There are some derived angles that will be useful: 
- The difference angle @@ (\theta_r - \theta_i)/2 @@ is denoted by @@ \theta_d @@.
- The relative azimuthal angle @@ \phi_r - \phi_i @@ is denoted by @@ \phi @@.
- There are two half angles:
    - On the longitudinal/incidence plane the half angle @@ (\theta_i + \theta_r)/2 @@ is denoted by @@ \theta_h @@
    - On the azimuth/normal plane the half angle @@ (\phi_i + \phi_r)/2 @@ is denoted by @@ \phi_h @@.

{{<figure caption="The hair coordinate frame">}}
    {{<canvas class="coordinate-frame" tabindex="0">}}
    {{<toolbox title="Hair Coordinate Frame Debug">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="theta_i" id="coordinate-frame-theta" min="-90" max="90" defaultValue="45" unit="°">}}
            {{<toolbox-slider label="phi_i" id="coordinate-frame-phi" min="-180" max="180" defaultValue="120" unit="°">}}
        {{</toolbox-container>}}
    {{</toolbox>}}
{{</figure>}}

## Radiometry

(todo)

## Scattering from Fibers

This section will cover the details of the scattering model and show that due to the symmetry of the cylinder, the 4D scattering function can be decomposed into the product of two 2D terms:
- Longitudinal scattering function M: models the scattering due to changes in @@ \theta @@.
- Azimuthal scattering function N: models the scattering due to changes in @@ \phi @@.

### Smooth Cylinder

For a smooth cylinder. The 4D scattering function can be decomposed into the product of two 2D terms using some geometric properties of the cylinder.

A light ray @@ \omega_i @@ that enters the cylinder with a given longitudinal angle @@ \theta @@ will exit with this same longitudinal angle @@ \theta @@, regardless of the number of reflection and refraction scattering events.

This means that rays with the same incident angle (parallel rays) from a direction @@ \omega_i @@ that scatter from a cylinder will lie on a cone around the tangent axis and contain @@ -\omega_i @@. The directions of any rays that get refracted into the cylinder also lie on this cone. This reduces the dimensions of the scattering function from 4D to a 3D (@@\theta_i, \phi_i, \phi_r @@) because scattering only occurs when @@ \theta_r = -\theta_i @@.

The scattering distribution dependence on the azimuthal angle @@ \phi_r @@ 

#### Loci of Reflections

The loci of reflections refers to the set of all directions of the reflected rays that form a cone.

In the diagram below the tangent **u** of the fiber points up and the normal vectors of the cylinder all lie in a plane perpendicular to the tangent called the normal plane.

From the symmetry of specular reflection, the incident direction @@ \omega_i @@ makes an angle @@ \theta @@ with the cylinder normal **n** and when reflected the reflected direction @@ \omega_r @@ will have the same angle. The reflected vector @@ \omega_r @@, incident direction @@ \omega_i @@ and normal @@ n @@ all lie on the same plane @@ n \times u @@. From the two triangles, and law of reflection the height of the cone @@ h_r = h_i = \sin\theta @@. This equidistance holds for any normal vector since the angle is the same, therefore for any given incident ray intersecting a cylinder with angle @@ \theta @@ the set of directions of the reflected ray will lie on a horizontal circle at a height of @@ \sin\theta @@.

{{<figure caption="Loci of reflection">}}
    {{<canvas class="loci-reflection" tabindex="0">}}
    {{<toolbox title="Loci of Reflections Debug">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="theta" id="loci-reflection-theta" min="-90" max="90" defaultValue="45" unit="°">}}
            {{<toolbox-slider label="phi" id="loci-reflection-phi" min="-180" max="180" defaultValue="90" unit="°">}}
        {{</toolbox-container>}}
    {{</toolbox>}}
{{</figure>}}

#### Loci of Refractions

Similar to the loci of reflections the refracted vector @@ \omega_t @@, incident direction @@ \omega_i @@ and normal @@ n @@ all lie on the same plane @@ n \times u @@.

From the two triangles formed by projecting each direction onto the normal plane the height is @@ h_i = \sin\theta @@ and @@ h_t = \sin\beta @@. Using Snell's law:

@@@ \sin(\theta) \cdot \eta_1 = \sin(\beta) \cdot \eta_2 @@@

Substituting @@ h_i @@ and @@ h_t @@ into Snell's law gives:

\begin{equation} h_i = \eta h_t \nonumber \end{equation}

where @@ \eta @@ is ratio of the incident medium @@ \eta_1 @@ to the refracting medium @@ \eta_2 @@.

Thus the distance @@ h_i @@ is factor @@ \eta @@ more than @@ h_t @@ . This means the cone formed by the set of refracted vectors will lie on a circle that will be a factor of @@ \eta @@ closer to the normal plane and all make the same angle @@ \theta @@ with the normal plane.

Since there are always two refraction scattering events, one entering the hair fiber and one exiting, they will effectively cancel each other out causing the ray that has refracted twice to have the same angle as the rays that have been reflected off the surface. Lastly due to the law of reflection any interior reflections that occur will keep the incident angle unchanged. 

This means that any ray that exits a cylinder, after any sequence of reflections and transmissions will end up in the same cone as the reflected rays.

{{<figure caption="Loci of refractions">}}
    {{<canvas class="loci-refraction" tabindex="0">}}
    {{<toolbox title="Loci of Refractions Debug">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="theta" id="loci-refraction-theta" min="-90" max="90" defaultValue="45" unit="°">}}
            {{<toolbox-slider label="phi" id="loci-refraction-phi" min="-180" max="180" defaultValue="120" unit="°">}}
        {{</toolbox-container>}}
    {{</toolbox>}}
{{</figure>}}

#### Bravias' Law

The Bravais index of refraction is used instead of the regular index of refraction, which will allow the scattering function in the cross-section of the fiber (normal plane) to be analyzed in 2D instead of having to doing it in 3D.

In the figure below a ray intersecting a plane and refracting into a medium. @@ \omega_i @@ is the incident direction @@ \omega_i^{\prime} @@ is the incident direction projected onto the normal plane, and @@ \gamma @@ is the angle between the incident direction and the normal plane. Similarly, @@ s(\eta, v_i) @@ is the refracted direction and @@ s(\eta, v_i)^{\prime} @@ is the refracted direction projected onto the normal plane and @@ \delta @@ is the angle between the refracted direction and the normal plane.

Furthermore @@ \sin\theta_i = \eta\sin\theta_t @@ and given that @@ \sin\theta_i = s_i @@, and @@ \sin\theta_t = s_t @@ where @@ s_i @@ is the length of the projection of @@ \omega_i @@ onto the horizontal plane, and @@ s_t @@ is the length of the projection of @@ s(\eta, \omega_i) @@ onto the horizontal plane. We can substitute into the equations to find @@ s_t = \frac{s_i}{\eta} @@. This tells us that the projection of @@ \omega_i @@ onto the horizontal plane is @@ \eta @@ times more than the length of the projection of @@ \omega_t @@.

@@ \alpha_i @@ is angle the incident direction @@ \omega_i @@ makes with the horizontal plane and @@ \alpha_i^\prime @@ is the angle the projected incident direction @@ \omega_i^\prime @@ makes with the horizontal plane. Similarly @@ \alpha_t @@ is the angle the refracted direction @@ s(\eta, \omega_i) @@ makes with the horizontal plane, and @@ \alpha_t^\prime @@ is the angle the projected refracted direction @@ s(\eta, \omega_i)^\prime @@ makes with the horizontal plane.

From the diagram the length of the projected incident direction @@ || \omega_i^{\prime} || @@ is equal to @@ \cos\gamma @@ and similarly the length of the projected refracted direction @@ || s(\eta, v_i)^{\prime} || @@ is equal to @@ \cos\delta @@. 

We can use this information to calculate the effective index of refraction for an incident ray that makes an angle @@ \gamma @@ with the normal plane, it is possible to calculate the projection of the refracted direction from the projection of the incident direction using Snell's law, but with the modified index of refraction @@ \eta^\prime @@ from equation @@ (13) @@:

{{<math>}}
@@@
\begin{align*}
    \eta^\prime &= \frac{\sqrt{\sin^2\gamma - \eta^2}}{\cos\gamma} \tag{13}
\end{align*}
@@@
{{</math>}}

{{<details class="hello-world" title="Derivation of the Bravias Index">}}
{{<p>}} Using trigonometry we can see that: {{</p>}}

@@@ \tag{1} \sin\alpha^\prime_i = \frac{\sin\alpha_i}{\cos\gamma} @@@

{{<p>}} Similarly, {{</p>}}

@@@ \tag{2} \sin\alpha^{\prime}_t = \frac{\sin\alpha_t}{\cos\delta} @@@

{{<p>}} Using Snell's law on the normal plane: {{</p>}}

@@@ \tag{3} \sin\alpha_i^\prime = \eta^\prime \sin\alpha_t^\prime @@@

{{<p>}} Substituting @@ (1) @@ and @@ (2) @@ into @@ (3) @@: {{</p>}}

@@@ \tag{4} \frac{\sin\alpha_i}{\cos\gamma} = \eta^\prime \frac{\sin\alpha_t}{\cos\delta} @@@

{{<p>}} Using Snell's law: {{</p>}}
@@@ \tag{5} \sin\alpha_i = \eta \sin\alpha_t @@@

{{<p>}} Substituting @@ (5) @@ into @@ (4) @@: {{</p>}}

@@@ \tag{6} \frac{\eta \sin\alpha_t}{\cos\gamma} = \eta^\prime \frac{\sin\alpha_t}{\cos\delta} @@@

{{<p>}} Simplifying gives: {{</p>}}

@@@ \tag{7} \eta^\prime = \eta \frac{\cos\delta}{\cos\gamma} @@@

{{<p>}} From the similar triangles in the horizontal plane: {{</p>}}

@@@ \tag{8} \frac{\sin\gamma}{s_i} = \frac{\sin\delta}{\frac{s_i}{\eta}} @@@

{{<p>}} Simplifying gives: {{</p>}}

@@@ \tag{9} \sin\gamma = \eta\sin\delta @@@

{{<p>}} Squaring both sides: {{</p>}}

@@@ \tag{10} \sin^2\gamma = \eta^2\sin^2\delta @@@

{{<p>}} Using the trig identity @@ cos^2\delta + sin^2\delta = 1 @@: {{</p>}}

@@@ \tag{11} \sin^2\gamma = \eta^2(1 - cos^2\delta) @@@

{{<p>}} Rearranging for @@ cos\delta @@: {{</p>}}

@@@ \tag{12} cos\delta = \sqrt{\frac{\sin^2\gamma - \eta^2}{\eta^2}} @@@

{{<p>}} Substituting @@ (12) @@ into @@ (7) @@: {{</p>}}

@@@
\begin{align*}
    \eta^\prime &= \eta \frac{\sqrt{\frac{\sin^2\gamma - \eta^2}{\eta^2}}}{\cos\gamma} \\
    \eta^\prime &= \eta \frac{\sqrt{\sin^2\gamma - \eta^2}}{ \eta\cos\gamma} \\
    \eta^\prime &= \frac{\sqrt{\sin^2\gamma - \eta^2}}{\cos\gamma} \tag{13}
\end{align*}
@@@
{{</details>}}

{{<figure caption="Bravais index">}}
    {{<canvas class="bravais" tabindex="0">}}
    {{<toolbox title="Bravais Index Debug">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="theta" id="bravais-theta" min="-90" max="90" defaultValue="-35" suffix="°">}}
            {{<toolbox-slider label="phi" id="bravais-phi" min="-180" max="180" defaultValue="140" suffix="°">}}
        {{</toolbox-container>}}
        {{<group direction="row" width="fit-content" alignment="end">}}
            {{<checkbox label="alpha" id="bravais-debug-alpha">}}
            {{<checkbox label="theta" id="bravais-debug-theta">}}
            {{<checkbox label="gamma" id="bravais-debug-gamma" checked="true">}}
            {{<checkbox label="delta" id="bravais-debug-delta" checked="true">}}
            {{<checkbox label="length" id="bravais-debug-length" checked="true">}}
            {{<checkbox label="values" id="bravais-debug-values">}}
        {{</group>}}
    {{</toolbox>}}
{{</figure>}}

### Longitudinal Scattering

The results from the section on [scattering from a smooth cylinder](#smooth-cylinder) showed that the directions of the modes of reflection will all lie on the same specular cone. The problem is scattering from a smooth cylinder does not include two features that are part of the hair model:
- Roughness: The surface is not perfectly flat, but made up of microscopic bumps causing the specular directions to randomly deviate from the perfect specular direction. This is caused by a change in the distribution of normals that can reflect light towards the eye direction thus blurring the specular highlight. 
- Specular Shift: The layers of cuticles are tilted causing the normals of the surface to deviate from a flat surface. This causes the modes of reflection to lie in different specular cones.

A gaussian distribution function is used to model roughness, by changing the standard deviation @@ \beta @@ to make the peak flatter or sharper, and specular shifting is modelled by changing the the mean angle @@ \phi_h - \alpha @@ about the center of the reflection.

The longitudinal scattering function M is defined as:
{{<math>}}
@@@
\begin{align*}
   M_R(\theta_h)   &= g(\beta_R, \phi_h - \alpha_R) \\
   M_{TT}(\theta_h)  &= g(\beta_{TT}, \phi_h -  \alpha_{TT}) \\
   M_{TRT}(\theta_h) &= g(\beta_{TRT}, \phi_h - \alpha_{TRT})
\end{align*}
@@@
{{</math>}}

where @@ g(\beta, \phi_h - \alpha) @@ is the normalized gaussian distribution function with zero mean, @@ \beta @@ is the standard deviation @@ \phi_h @@ is the half angle representing the angle required for specular reflection reciprocity, and @@ \alpha @@ is the shift angle about the mean:
{{<math>}}
@@@
\begin{align*}
   g(\beta, \phi_h, \alpha) = \frac{1}{\beta \sqrt{2 \pi}} exp(-\frac{(\phi_h - \alpha)^2}{2 \beta^2}) \\
\end{align*}
@@@
{{</math>}}

| Parameters          | Value                   | Description                         |
| :------------------ | :---------------------- | :---------------------------------- |
| @@ \alpha_{R}   @@  | [-10°, -5°]             | Longitudinal shift in R component   |
| @@ \alpha_{TT}  @@  | @@ \alpha_{R} / 2 @@    | Longitudinal shift in TT component  |
| @@ \alpha_{TRT} @@  | @@-3 \alpha_{R} / 2 @@  | Longitudinal shift in TRT component |
| @@ \beta_{R}    @@  | [5°, 10°]               | Longitudinal width of R component   |
| @@ \beta_{TT}   @@  | @@ \beta_{R} / 2 @@     | Longitudinal width of TT component  |
| @@ \beta_{TRT}  @@  | @@ 2 \beta_{R} @@       | Longitudinal width of TRT component |

{{<figure caption="Longitudinal scattering function M">}}
    {{<canvas class="M-function-plot" width="300px" height="300px" tabindex="0">}}
    {{<toolbox title="Longitudinal Scattering Function M Debug">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="beta" id="M-function-plot-beta" min="0" max="100" step="0.1" defaultValue="10" unit="°">}}
            {{<toolbox-slider label="alpha" id="M-function-plot-alpha" min="-10" max="10" defaultValue="0" unit="°">}}
        {{</toolbox-container>}}
        {{<group direction="horizontal" alignment="end">}}
            {{<button id="M-function-plot-reset" label="Reset Camera Position">}}
        {{</group>}}
    {{</toolbox>}}
{{</figure>}}

### Azimuthal Scattering

This section derives the azimuthal scattering function, N, describing the light scattering through the cross-section (normal plane) of the fiber. N is only a function of the relative azimuthal angle @@ \phi = \phi_r - \phi_i @@, reducing the azimuthal scattering from a 2D function to a 1D function.

#### Scattering from Circular Cross Section

We assume that the cross section of a fiber is circular with a radius of one. We can analyze the scattering by tracing rays and determining the path through the cross section. 

From the figure below a ray with incident angle @@ \gamma_i @@ on an unit circle at an offset of @@ h \in [-1, 1] @@ from the center can be calculated using trigonometry @@ h = \sin\gamma_i @@. From Snell's law the refracted ray is @@ h = \eta^\prime\sin\gamma_t @@. The exit angle @@ \phi(p, h) @@ is calculated by following the path of the ray as interacts with the fiber and is used to determine the deviation of the angle at each interaction. By convention the incident direction @@ \omega_i @@ points away from the surface.

Using geometric optics we can see the incident ray will refract by @@ \gamma_t - \gamma_i @@ when it enters and for each internal reflection the ray will reflect by @@ \pi + 2\gamma_t @@, and will refract by @@ \gamma_t - \gamma_i @@ again as it exits. We can use this information to calculate the exit angle:

\begin{equation} \phi(p, h) = 2p\gamma_t - 2\gamma_i + p\pi \end{equation}

Where p denotes the number of internal path segments. The equation @@ \phi(p, h) @@ can describe the three [modes of reflections](#modes-of-reflection) where:
- p = 0: Surface reflection (R)
- p = 1: Transmission (TT)
- p = 2: One internal reflection (TRT)

{{<figure caption="h offset">}}
    {{<canvas class="h-offset" tabindex="0">}}
    {{<toolbox title="h Offset">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="gamma" id="tester" min="-90" max="90" defaultValue="45" unit="°">}}
            {{<toolbox-slider label="theta" id="theta" min="-90" max="90" defaultValue="0" unit="°">}}
        {{</toolbox-container>}}
    {{</toolbox>}}
{{</figure>}}

Equation (1) is defined in terms of the offset h, however to calculate the scattering going in a given outgoing direction @@ \phi @@ we need to solve the roots of the function @@ \phi(p, h) - \phi = 0 @@. The function to calculate the roots is denoted by @@ h(p, r, \phi) @@ where the parameter r contains the roots. In the case when p = 0, or p = 1 there is a single root, corresponding to a single path, but when p = 2, there may be one or three roots, corresponding to one or three paths.

For the path corresponding to p = 2, @@ \phi(2, h) @@ it is possible to find out when the ray splits into three paths by determining when @@ \frac{\mathrm{d} \phi}{\mathrm{d}h} = 0 @@. This represents a fold in the caustic and due to the symmetry of the circle there will be two such values of h that will give the same value of @@ \phi @@.

{{<math>}}
@@@
\begin{align*}
   \tag{1}\phi = 2p\gamma_t - 2\gamma_i + p\pi \\ 
\end{align*}
@@@
{{</math>}}

Solving the derivative for h when @@ \frac{\mathrm{d} \phi}{\mathrm{d}h} = 0 @@ gives: 

{{<math>}}
@@@
\begin{align*}
\tag{3} h &= \pm\sqrt{\frac{4 - \eta^{\prime}{^2}}{3}}\\
\end{align*}
@@@
{{</math>}}

{{<details title="Derivation of the caustic h(offset)">}}
When p = 2:

{{<math>}}
@@@
\begin{aligned}
   \phi &= 4\gamma_t - 2\gamma_i + 2\pi \\ 
   \phi &= 4\sin^{-1}(\cfrac{h}{\eta^\prime}) - 2\sin^{-1}(h) + 2\pi
\end{aligned}
@@@
{{</math>}}

Taking the derivative w.r.t h:

{{<math>}}
@@@
\begin{align*}
    \frac{\mathrm{d} \phi}{\mathrm{d}h} = \frac{4}{\eta^{\prime}\sqrt{1 - (\frac{h}{\eta^{\prime}})^{2} }} - \frac{2}{\sqrt{1 - h^{2} }}
\end{align*}
@@@
{{</math>}}

When @@ \frac{\mathrm{d} \phi}{\mathrm{d}h} = 0 @@:

{{<math>}}
@@@
\begin{align*}
    0  &= \frac{4}{\eta^{\prime}\sqrt{1 - (\frac{h}{\eta^{\prime}})^{2} }} - \frac{2}{\sqrt{1 - h^{2} }} \\
       &= 4\sqrt{1 - h^{2} } - 2\eta^{\prime}\sqrt{1 - (\frac{h}{\eta^{\prime}})^{2} } \\ 
       &= 2\sqrt{1 - h^{2} } - \eta^{\prime}\sqrt{1 - (\frac{h}{\eta^{\prime}})^{2} } \\ 
       &= 4(1 - h^{2}) - \eta^{\prime}{^2}(1 - (\frac{h}{\eta^{\prime}})^{2}) \\ 
       &= 4 - 4h^{2} - \eta^{\prime}{^2} + h^{2} \\ 
       &= 4 - 3h^{2} - \eta^{\prime}{^2}\\ 
3h^{2} &= 4 - \eta^{\prime}{^2}\\ 
 h^{2} &= \frac{4 - (\eta^{\prime}){^2}}{3}\\ 
\tag{3}
     h &= \pm\sqrt{\frac{4 - \eta^{\prime}{^2}}{3}}\\
\end{align*}
@@@
{{</math>}}
{{</details>}}

{{<figure caption="h caustic">}}
    {{<canvas class="canvasHCaustic" tabindex="0">}}
    {{<toolbox title="Hair Caustic Debug">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="theta" id="h-caustic-theta" min="-90" max="90" defaultValue="0" unit="°">}}
            {{<toolbox-slider label="ior" id="h-caustic-ior" min="1" max="2" defaultValue="1.33" step="0.01">}}
        {{</toolbox-container>}}
        {{<group direction="column" width="fit-content" alignment="start">}}
            {{<label text="Select caustic offset">}}
        {{</group>}}
        {{<group direction="row" width="fit-content" alignment="start">}}
            {{<radio id="h-caustic 1" name="caustic-roots" value="root1" label="+h(caustic)" checked="true">}}
            {{<radio id="h-caustic 2" name="caustic-roots" value="root2" label="-h(caustic)">}}
        {{</group>}}
    {{</toolbox>}}
{{</figure>}}

To calculate the intensity of the scattered light we can use the principle of energy conservation. The curve irradiance @@ \overline{E} @@, illuminates the cross section with uniform irradiance @@ E(h) = \overline{E} / 2 @@ across the width of length two because we assume the cross section has a radius of one.

A small change in h, @@ dh @@, will also change the curve intensity due to a small change in the relative azimuthal angle @@ d\phi @@.

{{<math>}}
\begin{equation}
\overline{L}(\phi(h))d\phi = E(h)dh = (\overline{E} / 2) dh
\end{equation}
{{</math>}}

Rearranging for the curve intensity @@ \overline{L}(\phi(h)) @@ gives:

{{<math>}}
\begin{equation}
\overline{L}(\phi(h)) = {\lvert2\frac{d\phi}{dh}\lvert}^{-1} \overline{E}
\end{equation}
{{</math>}}

One way to think of the term @@ {\lvert \frac{d\phi}{dh} \lvert}^{-1} @@ is as a measure of how dense the rays are. For example in the case when @@ \frac{\mathrm{d} \phi}{\mathrm{d}h} = 0 @@ the value of the curve intensity is infinite due to the division by 0, this corresponds to all the rays being focused into a single direction. This singularity is called a caustic.

For a circular cross section there will be two symmetric caustics which are the cause of the glints. As the bravais index increases with the angle to the normal plane @@ \theta @@, the two caustics will move closer to the normal plane as the ray direction becomes more parallel to the fiber. When @@ \eta^\prime @@ reaches a value of two, the caustic will disappear.

#### Absorption and Fresnel Equations

In this section we look at light absorption which gives color to the hair fiber, and the Fresnel equations which describe the reflection and transmission of light at the interface between the surface and interior.

To calculate the absorption we must know the length of the path the light travels inside the fiber. From the figure below the cosine function can be used to find the length of each internal path segment @@ l = 2d @@. where @@ d = \cos\gamma_t @@. The absorption coefficient @@ \sigma_a @@ is defined as the probability density of an absorption scattering event ocurring per unit distance. We can use Beer's law to calculate the fraction of light transmitted for a segment since the interior medium is homogeneous the absorption coefficient is constant:

We also need to take into account the change in the path length due to the refraction of the incident direction in the longitudinal plane, the distance the ray travels is a factor @@ \frac{1}{\cos\theta_t} @@ more.

{{<figure caption="path length">}}
    {{<canvas class="path-length" tabindex="0">}}
    {{<toolbox title="Path length">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="gamma" id="path-length-gamma" min="-90" max="90" defaultValue="45" unit="°">}}
            {{<toolbox-slider label="theta" id="path-length-theta" min="-90" max="90" defaultValue="0" unit="°">}}
        {{</toolbox-container>}}
    {{</toolbox>}}
{{</figure>}}


The term for absorption for a ray that has traveled a distance of @@ l @@ is given by:

{{<math>}}
\begin{equation}
\begin{align*}
    T_r &= e^{-\sigma_a l / \cos\theta_t} = e^{-\sigma_a 2 \cos\gamma_t / \cos\theta_t} \nonumber
\end{align*}
\end{equation}
{{</math>}}

The attenuation term A is defined as:

{{<math>}}
\begin{align}
    A(0, h) &= F(\eta^\prime, \eta^{\prime\prime}, \gamma_i) \\
    A(p, h) &= (1 - F(\eta^\prime, \eta^{\prime\prime}, \gamma_i))^2 \newline &\phantom{=} F(\frac{1}{\eta^\prime}, \frac{1}{\eta^{\prime\prime}}, \gamma_i)^{p - 1} T(\sigma_a, h)^p \nonumber
\end{align}
{{</math>}}

The azimuthal scattering function N is defined over all modes of reflection p, and all roots:

{{<math>}}
@@@
\begin{align*}
   N(\phi) &= \sum_p{N_p(p, \phi)} \\
   N_p(p, \phi) &= \sum_r{A(p, h(p, r)) {|2\frac{d\phi}{dh}(p, h(p, r))|}^{-1} }
\end{align*}
@@@
{{</math>}}

### Solving the paths

To find angle @@ \phi @@ of the scattering path we need to solve equation (1) for the offset h. An approximation can be used instead of solving h exactly because it starts to get complicated after the first component. This approximation is used for the TRT component.

#### Solving the mode p = 0 (Reflection)

This path can be solve exactly for h. Given p = 0 and @@ h = \sin\gamma_i @@ rearranging for @@ \gamma_i @@ gives @@ \gamma_i = sin^{-1}h @@ we want to solve @@ \phi(p, h) - \phi = 0 @@ where @@ \phi(p, h) = 2p\gamma_t - 2\gamma_i + p\pi @@.

@@@ h_{R} = \sin(\frac{\phi}{2}) @@@
@@@ \frac{d\phi}{dh_R} = \frac{2}{\sqrt{1 - h_{R}^2}} @@@

{{<details title="Derivation of h and @@ \frac{d\phi}{dh} @@ for the R component">}}

@@@ \phi(p, h) - \phi = 0 @@@

{{<p>}} substituting in @@ \phi(p,h) @@{{</p>}}

@@@ 2p\gamma_t - 2\gamma_i + p\pi - \phi = 0 @@@

{{<p>}} substituting in @@ p = 0 @@{{</p>}}

@@@ -2\gamma_i - \phi = 0 @@@

{{<p>}} rearranging for  @@ \gamma_i @@{{</p>}}

@@@ \gamma_i = \frac{\phi}{2} @@@

{{<p>}} substituting in @@ \gamma_i = sin^{-1}h @@{{</p>}}

@@@ sin^{-1}h = \frac{\phi}{2} @@@

@@@ h = \sin(\frac{\phi}{2}) @@@

{{<p>}}  We need to also calculate @@ \frac{d\phi}{dh} @@ rearranging eq (2) for @@ \phi @@  {{</p>}}
@@@ \phi = 2 \sin^{-1}h @@@

{{<p>}} taking the derivative wrt h gives:{{</p>}}

@@@ \frac{d\phi}{dh} = \frac{2}{\sqrt{1 - h^2}} @@@

{{</details>}}

#### Solving the mode p = 1 (Transmission)

The complexity after the reflection mode increase exponentially, but this path can also be solved exactly and the results are included here from {{<cite `d'Eon2011`>}}.

@@@ h_{TT} = \frac{\text{sign}(\phi)\cos(\frac{\phi}{2})}{\sqrt{1 + a^2 - 2a\space\text{sign}(\phi)\sin(\frac{\phi}{2})}} @@@

where @@ a = \frac{1}{\eta^\prime} @@

@@@ \frac{d\phi}{dh_{TT}} = \frac{2}{\eta^{\prime}\sqrt{1 - h_{TT}^2}} - \frac{2}{\sqrt{1 - h_{TT}^2}}@@@

{{<details title="Derivation of @@ \frac{d\phi}{dh} @@ for the TT component">}}

@@@ \phi(p, h) - \phi = 0 @@@

{{<p>}} substituting in @@ \phi(p,h) @@ when @@ p = 1 @@ gives{{</p>}}

@@@ 2\gamma_t - 2\gamma_i + \pi - \phi = 0 @@@

{{<p>}} substituting values for @@ \gamma_t @@ and @@ \gamma_i @@ {{</p>}}

@@@ 2\sin^{-1}(\frac{h}{\eta^\prime}) - 2\sin^{-1}h + 2\pi - \phi = 0 @@@

{{<p>}}  Rearranging for @@ \phi @@ {{</p>}}

@@@ \phi = 2\sin^{-1}(\frac{h}{\eta^\prime}) - 2\sin^{-1}h + 2\pi @@@

{{<p>}}  Taking the deriviative wrt h gives: {{</p>}}

@@@ \frac{d\phi}{dh} = \frac{2}{\eta^{\prime}\sqrt{1 - h^2}} - \frac{2}{\sqrt{1 - h^2}}@@@

{{</details>}}

#### Solving the mode p = 2 (TRT)

For this path we solve the roots of equation (10) using a cubic root solver, which may have one or three roots corresponding to a single path or three paths. The paper {{<cite Marschner2003>}} provides a cubic polynomial approximation for @@ \gamma_t @@:
{{<math>}}
@@@
\begin{align*}
   \gamma_t &= \frac{3c}{\pi}\gamma_i - \frac{4c}{\pi^3}\gamma_i^{3} \\   
\end{align*}
@@@
{{</math>}}

where @@c = \sin^{-1}(\frac{1}{\eta^{\prime}}) @@

Substituting this into @@ \phi(p, h) = 2p\gamma_t - 2\gamma_i + p\pi @@ gives:

{{<math>}}
@@@
\begin{align*}
   \hat{\phi}(p, \gamma_i) &= 2p(\frac{3c}{\pi}\gamma_i - \frac{4c}{\pi^3}\gamma_i^3) - 2\gamma_i + p\pi \\
                           &= \frac{6pc}{\pi}\gamma_i - \frac{8pc}{\pi^3}\gamma_i^3 - 2\gamma_i + p\pi \\
                           \tag{10}&= (\frac{6pc}{\pi} - 2)\gamma_i - \frac{8pc}{\pi^3}\gamma_i^3 + p\pi \\
\end{align*}
@@@
{{</math>}}

@@@ \tag{10} \hat{\phi}(p, \gamma_i) = (\frac{6pc}{\pi} - 2)\gamma_i - \frac{8pc}{\pi^3}\gamma_i^3 + p\pi @@@

When p = 2:

@@@ \hat{\phi}(p, \gamma_i) = (\frac{12c}{\pi} - 2)\gamma_i - \frac{16c}{\pi^3}\gamma_i^3 + 2\pi @@@

and, we want to solve for @@ \gamma_i @@:

@@@ \hat{\phi(p, h)} - \phi = 0 @@@

Substituting into (10) into (2)

@@@ (\frac{12c}{\pi} - 2)\gamma_i - \frac{16c}{\pi^3}\gamma_i^3 + (2\pi - \phi) = 0 @@@

Once the value(s) of @@ \gamma_i @@ are found we can use @@ h = \sin\gamma_i @@ to find @@ h @@

@@@ h_{TRT} = h_{\text{solve}}(p, r, \phi) @@@

@@@ \frac{d\phi}{dh_{TRT}} = \frac{4}{\eta^{\prime}\sqrt{1 - (\frac{h_{TRT}}{\eta^\prime})^2}} - \frac{2}{\sqrt{1 - h_{TRT}^2}}@@@

@@@ \frac{d^2\phi}{dh^2} = \frac{4h}{\eta^{\prime3}(1 - (\frac{h}{\eta^{\prime}})^2)^{\frac{3}{2}}} - \frac{2h}{(1-h^2)^{\frac{3}{2}}} @@@

{{<details title="Derivation of @@ \frac{d\phi}{dh} @@ for the TRT component">}}

@@@ \phi(p, h) - \phi = 0 @@@

{{<p>}} substituting in @@ \phi(p,h) @@ when @@ p = 2 @@ gives{{</p>}}

@@@ 4\gamma_t - 2\gamma_i + 2\pi - \phi = 0 @@@

{{<p>}} substituting values for @@ \gamma_t @@ and @@ \gamma_i @@ {{</p>}}

@@@ 4\sin^{-1}(\frac{h}{\eta^\prime}) - 2\sin^{-1}h + 2\pi - \phi = 0 @@@

{{<p>}}  Rearranging for @@ \phi @@ {{</p>}}

@@@ \phi = 4\sin^{-1}(\frac{h}{\eta^\prime}) - 2\sin^{-1}h + 2\pi @@@

{{<p>}} Taking the deriviative wrt h gives: {{</p>}}

@@@ \frac{d\phi}{dh} = \frac{4}{\eta^{\prime}\sqrt{1 - \frac{h}{\eta^{\prime}}^2 }} - \frac{2}{\sqrt{1 - h^2}}@@@

{{</details>}}

{{<details title="Derivation of @@ \frac{d^{2}\phi}{dh^2} @@ for the TRT component">}}

@@@ \frac{d\phi}{dh} = \frac{4}{\eta^{\prime}\sqrt{1 - (\frac{h}{\eta^{\prime}})^2}} - \frac{2}{\sqrt{1 - h^2}}@@@

{{<p>}} Taking the derivative of the above wrt h {{</p>}}

@@@ \frac{d^2\phi}{dh^2} = \frac{d}{dh}\Big(\frac{4}{\eta^{\prime}\sqrt{1 - (\frac{h}{\eta^{\prime}})^2}}\Big) - \frac{d}{dh}\Big(\frac{2}{\sqrt{1 - h^2}}\Big)@@@

@@@ \frac{d}{dh}\Big(\frac{4}{\eta^{\prime}\sqrt{1 - (\frac{h}{\eta^{\prime}})^2}}\Big) = \frac{4 \cdot -\frac{1}{2} \cdot - \frac{2h}{{\eta^{\prime2}}} }{\eta^\prime(1-(\frac{h}{\eta^{\prime}})^2)^{\frac{3}{2}}} = \frac{4h}{\eta^{\prime3}(1-(\frac{h}{\eta^{\prime}})^2)^{\frac{3}{2}}}@@@

@@@ \frac{d}{dh}\Big(\frac{2}{\sqrt{1 - h^2}}\Big) = \frac{2 \cdot -\frac{1}{2} \cdot -2h}{(1-h^2)^{\frac{3}{2}}} = \frac{2h}{(1-h^2)^{\frac{3}{2}}} @@@

{{<p>}} Substituting (3) and (4) back into (2) {{</p>}}

@@@ \frac{d^2\phi}{dh^2} = \frac{4h}{\eta^{\prime3}(1 - (\frac{h}{\eta^{\prime}})^2)^{\frac{3}{2}}} - \frac{2h}{(1-h^2)^{\frac{3}{2}}} @@@

{{</details>}}

## The Marschner Model

The Marschner model is defined as:

{{<math>}}
@@@
\begin{align*}
    S(\phi_i, \theta_i, \phi_r, \theta_r) &= \\
    &\space \frac{M_{R}(\theta_h)N_{R}(\eta^{\prime}(\eta, \theta_d), \phi)}{\cos^{2}\theta_d} \space + \\
    &\space \frac{M_{TT}(\theta_h)N_{TT}(\eta^{\prime}(\eta, \theta_d), \phi)}{\cos^{2}\theta_d} \space + \\
    &\space \frac{M_{TRT}(\theta_h)N_{TRT}(\eta^{\prime}(\eta, \theta_d), \phi)}{\cos^{2}\theta_d}
\end{align*}
@@@
{{</math>}}

Only the angles @@ \theta_d @@ , @@ \phi @@, @@ \theta_h @@, and @@ \phi_h @@ are used in the longitudinal and azimuthal scattering functions due to the symmetry of the scattering function S and hints at the reciprocity of the model.

### Approximations for TRT (p = 2) mode

The analysis on the [scattering from the cross section](#scattering-from-circular-cross-section) of a smooth cylinder showed that there will be two symmetric caustics for the TRT component. This results in two singularities with infinite intensity for the value of the function @@ N_{TRT}(\eta^{\prime}(\eta, \theta_d))@@ as shown in the figure below. This would not be the case if the surface roughness is modelled, so the Marschner model removes the caustics from the function and replaces them with a gaussian distribution lobe centered at the location of the caustics. The width of this distribution is used to approximate the roughness.

The caustic appears when @@ \frac{d\phi}{dh} = 0 @@, and the angle @@ \phi @@ can be calculate from equation (1). When @@ \eta^\prime @@ reaches a value of two, the caustic will disappear.

| Parameters              | Value       | Description                     |
| :---------------------- | :-----------| :------------------------------ |
| @@ k_{G}   @@           | [0.5, 5]    | Glint scale factor              |
| @@ w_{c}  @@            | [10°, 25°]  | Azimuthal width of caustic      |
| @@ \Delta\eta^\prime @@ | [0.2, 0.4]  | Fade range at the caustic merge |
| @@ \Delta{h_{M}}    @@  | 0.5         | Caustic intensity limit         |

{{<figure caption="Azimuthal scattering function N for TRT (p = 2)">}}
    {{<canvas class="N-function-plot" width="512px" height="512px" tabindex="0">}}
    {{<toolbox title="Azimuthal Scattering Function N (TRT) Debug">}}
        {{<toolbox-container>}}
            {{<toolbox-slider label="theta_d" id="N-function-plot-beta" min="0" max="90" step="0.1" defaultValue="0" unit="°">}}
            {{<toolbox-slider label="wC" id="N-function-plot-wC" min="0" max="90" defaultValue="10" unit="°" step="0.1">}}
            {{<toolbox-slider label="kG" id="N-function-plot-kG" min="0.5" max="5" defaultValue="0.5" step="0.1">}}
            {{<toolbox-slider label="Δη'" id="N-function-plot-deltaEtaP" min="0.2" max="0.4" defaultValue="0.2" step="0.01">}}
            {{<toolbox-slider label="ΔhM" id="N-function-plot-deltaHM" min="0" max="1" defaultValue="0.5" step="0.1">}}
        {{</toolbox-container>}}
        {{<group direction="row" width="fit-content" alignment="end">}}
            {{<checkbox label="N_TRT" id="N-function-plot-trt" checked="true">}}
            {{<checkbox label="N_TRT approximation" id="N-function-plot-trt-approximation">}}
        {{</group>}}
        {{<group direction="horizontal" alignment="end">}}
            {{<button id="N-function-plot-reset" label="Reset Camera Position">}}
        {{</group>}}
    {{</toolbox>}}
{{</figure>}}


```cpp
float3 N_TRT(float thetaD, float phi, float wC, float kG, float deltaEtaP, float deltaH_M)
{
  float hairIOR = 1.55;
  float sinThetaD = sin(thetaD);
  float cosThetaD = sqrt(1 - sinThetaD * sinThetaD);
  float etaP = sqrt(hairIOR * hairIOR - sinThetaD * sinThetaD) / cosThetaD;
    
  float hC = sqrt((4 - etaP * etaP) / 3);
  float phiC = asin(hC);
  float dPhid2H2 = (4*hC) / pow(etaP*etaP - hC*hC, 3.0/2) - (2*hC) / pow(1 - hC*hC, 3.0/2);
  float deltaH = min(deltaH_M, 2 * sqrt(2 * wC / abs(dPhid2H2)));
  float t = 1;
    
  if(etaP >= 2)
  {
      phiC = 0;
      deltaH = deltaH_M;
      t = smoothstep(2, 2 + deltaEtaP, etaP);
  }

  L = Np(2, phi);
  L = L * (1 - t * g(wC, phi - phic) / g(wC, 0));
  L = L * (1 - t * g(wC, phi + phic) / g(wC, 0));
  L = L + t * kG * A(2, thetaD, phi) * deltaH * (g(wC, phi - phiC) + g(wC, phi + phiC));
  return L;
}
```

## Results

{{<figure src="marschner-hair-preview-black.png" caption="A comparison between realtime hair shading using the Marschner model + dual scattering, and reference photos from {{<cite Karis2016>}}" align="center" width="800px" loading="lazy"/>}}

## References

{{<citation>}}