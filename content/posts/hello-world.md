+++
date = '2024-12-22'
draft = false
title = 'Hello World'
scripts = ["loci-reflection.js"]
toc = true
side = true
+++

## Introduction

Hello World! This is a test post demonstrating some features of markdown.

## Canvas

Hugo allows you to put HTML elements inside snippets called shortcodes, which avoids having to add raw HTML to markdown files and helps with code reuse. The canvas shortcode can be called using the following syntax:

```go {class="my-class" id="my-codeblock" lineNos=false tabWidth=2}
{{</* canvas class="class-name" tabindex="0" */>}}
```

{{< canvas class="loci-reflection" tabindex="0" >}}
{{< toolbox title="Loci of Reflections Debug" >}}
    {{< toolbox-container >}}
        {{< toolbox-slider label="theta" id="loci-reflection-theta" min="-90" max="90" defaultValue="45" unit="°" >}}
        {{< toolbox-slider label="phi" id="loci-reflection-phi" min="-180" max="180" defaultValue="120" unit="°" >}}
    {{< /toolbox-container >}}
{{< /toolbox >}}

## Code Blocks

Code blocks are supported using the built in support of Chroma in Hugo. Code can be added to markdown enclosed in three backticks followed by the programming language.

```go {class="my-class" id="my-codeblock" lineNos=false tabWidth=2}
```hlsl {class="my-class" id="my-id" lineNos=false tabWidth=2}```
```

A custom class and id can be used to style or be used in javascript.

```c {class="my-class" id="my-codeblock" lineNos=false tabWidth=2}
    HR(D3D11CreateDevice(NULL, D3D_DRIVER_TYPE_HARDWARE, 
    NULL, createDeviceFlags, featureLevels, ARRAYSIZE(featureLevels), D3D11_SDK_VERSION, &md3dDevice, &md3dFeatureLevel, &md3dDeviceContext));
    
    md3dDeviceContext->QueryInterface(__uuidof(ID3DUserDefinedAnnotation), (void**)(&mUserDefinedAnnotation));

    DXGI_SWAP_CHAIN_DESC1 sd;
    ZeroMemory(&sd, sizeof(sd));
    sd.Width = mWidth;
    sd.Height = mHeight;
    sd.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    sd.Flags = 0;
    sd.BufferCount = 2;
    sd.SampleDesc.Count = 1;
    sd.SampleDesc.Quality = 0;
    sd.SwapEffect = DXGI_SWAP_EFFECT_DISCARD;
    sd.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    
    DXGI_SWAP_CHAIN_FULLSCREEN_DESC fsd;
    ZeroMemory(&fsd, sizeof(fsd));
    fsd.RefreshRate.Numerator = 60000;
    fsd.RefreshRate.Denominator = 1001;
    fsd.Windowed = TRUE;
    fsd.Scaling = DXGI_MODE_SCALING_UNSPECIFIED;

    IDXGIDevice3* dxgiDevice = nullptr;
    HR(md3dDevice->QueryInterface(__uuidof(IDXGIDevice3), (void**)&dxgiDevice));
    IDXGIAdapter* dxgiAdapter = nullptr;
    HR(dxgiDevice->GetParent(__uuidof(IDXGIAdapter), (void**)&dxgiAdapter));
    IDXGIFactory2* dxgiFactory = nullptr;
    HR(dxgiAdapter->GetParent(__uuidof(IDXGIFactory2), (void**)&dxgiFactory));

```

## Math

The markdown for math equations uses KaTeX for rendering and must be put inside the math shortcode for proper alignment and resizing.

```tex {class="my-class" id="my-codeblock" lineNos=false tabWidth=2}
{{</* math */>}}
@@@ \displaystyle \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right) @@@
{{</* /math */>}}
```

{{< math >}}
@@@ \displaystyle \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right) @@@
{{< /math >}}

{{< math >}}
@@@ \displaystyle {1 +  \frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots }= \prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})}, \quad\quad \text{for }\lvert q\rvert<1.@@@
{{< /math >}}

{{< math >}}
@@@
\begin{aligned}
KL(\hat{y} || y) &= \sum_{c=1}^{M}\hat{y}_c \log{\frac{\hat{y}_c}{y_c}} \\
JS(\hat{y} || y) &= \frac{1}{2}(KL(y||\frac{y+\hat{y}}{2}) + KL(\hat{y}||\frac{y+\hat{y}}{2}))
\end{aligned}
@@@
{{< /math >}}

{{< math >}}
  \begin{align}
  \textcolor{ff0000}{x_i} &= \textcolor{22aa33}{x_s} + (\textcolor{00d19f}{x_e} - \textcolor{1a20ff}{x_s}) \cdot t \\
  \textcolor{ff0000}{y_i} &= \textcolor{22aa33}{y_s} + (\textcolor{00d19f}{y_e} - \textcolor{1a20ff}{y_s}) \cdot t \\
  \textcolor{ff0000}{z_i} &= \textcolor{22aa33}{z_s} + (\textcolor{00d19f}{z_e} - \textcolor{1a20ff}{z_s}) \cdot t
  \end{align}
{{< /math >}}

{{< math >}}
\begin{equation}
   \begin{split}
   a^2 + b^2 &= c^2 \\
   a^2 &= c^2 - b^2\\
   a &= \sqrt{c^2 - b^2}\\ 
   \end{split}
\end{equation}
{{< /math >}}

## Information Boxes

Information boxes give important information to the reader and is created using shortcodes.

```go {class="my-class" id="my-codeblock" lineNos=false tabWidth=2}
{{</* info-box information */>}}
Text goes inside here
{{</* /info-box */>}}
```

{{< info-box warning>}}
Anim eiusmod irure incididunt sint cupidatat. Incididunt irure irure irure nisi ipsum do ut quis fugiat consectetur proident cupidatat incididunt cillum. Dolore voluptate occaecat qui mollit laborum ullamco et. Ipsum laboris officia anim laboris culpa eiusmod ex magna ex cupidatat anim ipsum aute. Mollit aliquip occaecat qui sunt velit ut cupidatat repre
{{< /info-box >}}

{{< info-box information>}}
Anim eiusmod irure incididunt sint cupidatat. Incididunt irure irure irure nisi ipsum do ut quis fugiat consectetur proident cupidatat incididunt cillum. Dolore voluptate occaecat qui mollit laborum ullamco et. Ipsum laboris officia anim laboris culpa eiusmod ex magna ex cupidatat anim ipsum aute. Mollit aliquip occaecat qui sunt velit ut cupidatat repre
{{< /info-box >}}
