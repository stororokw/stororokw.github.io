export class float2
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    add(v)
    {
        return new float2(this.x + v.x, this.y + v.y);
    }

    mul(a)
    {
        if(Object(a) instanceof Number)
        {
            return new float2(this.x * a, this.y * a);
        }
    }

    sub(v)
    {
        return new float2(this.x - v.x, this.y - v.y);
    }

    normalize()
    {
        const length = Math.sqrt(this.x * this.x + this.y * this.y);
        return new float2(this.x / length, this.y / length);
    }

    length()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    distance(b)
    {
        const c = new float2(this.x - b.x, this.y - b.y);
        return c.length();
    }

    dot(b)
    {
        return this.x * b.x + this.y * b.y;
    }

    neg(x)
    {
        return new float2(-this.x, -this.y);
    }

    cross(v)
    {
        return this.x * v.y - this.y * v.x;
    }
}

export class float3
{
    constructor(x = 0, y = 0, z = 0)
    {
        if(x instanceof float3)
        {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
        }
        else if(x instanceof float2)
        {
            this.x = x.x;
            this.y = x.y;
            this.z = y;
        }
        else if(Array.isArray(x) && x.length === 3)
        {
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
        }
        else if(Object(x) instanceof Number && arguments.length == 1)
        {
            this.x = x;
            this.y = x;
            this.z = x;
        }
        else
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    add(v)
    {
        return new float3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    sub(b)
    {
        return new float3(this.x - b.x, this.y - b.y, this.z - b.z);
    }
    
    mul(m)
    {
        if(Object(m) instanceof Number && arguments.length === 1)
        {
            return new float3(this.x * m, this.y * m, this.z * m);
        }
        else if(m instanceof mat3x3)
        {
            return new float3(
                this.x * m.m[0] +  this.y * m.m[3] + this.z * m.m[6] ,
                this.x * m.m[1] +  this.y * m.m[4] + this.z * m.m[7] ,
                this.x * m.m[2] +  this.y * m.m[5] + this.z * m.m[8]
            );
        }
        else if(m instanceof mat4x4)
        {
            const temp = new float4(this.x, this.y, this.z, 0);
            const result = temp.mul(m);
            return new float3(result.x, result.y, result.z);
        }
        return new float3(this.x * m, this.y * m, this.z * m);

    }

    div(s)
    {
        return new float3(this.x / s, this.y / s, this.z / s);
    }

    neg()
    {
        return new float3(-this.x, -this.y, -this.z);
    }

    addEquals(v)
    {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    subEquals(v)
    {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    divEquals(s)
    {
        this.x /= s;
        this.y /= s;
        this.z /= s;
        return this;
    }

    cross(v)
	{
		return new float3(this.y * v.z - v.y * this.z, v.x * this.z - this.x * v.z, this.x * v.y - this.y * v.x);
	}
    
    dot(b)
    {
        return this.x * b.x + this.y * b.y + this.z * b.z;
    }

    length()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    lengthSquared()
    {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    normalize()
    {
        const length = this.length();
        return this.div(length);
    }

    normalized()
    {
        const length = this.length();
        this.x /= length;
        this.y /= length;
        this.z /= length;
        return this;
    }
    
    toString()
    {
        return `float3(${this.x}, ${this.y}, ${this.z})`;
    }

    distance(b)
    {
        return length(this.sub(b));
    }
}

export class float4
{
    constructor(x = 0, y = 0, z = 0, w = 0)
    {
        if(x instanceof float3)
        {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
            this.w = y;
        }
        else if(Array.isArray(x) && x.length === 4)
        {
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
            this.w = x[3];
        }
        else if(arguments.length === 1)
        {
            this.x = x;
            this.y = x;
            this.z = x;
            this.w = x;
        }
        else
        {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }

    }

    add(v)
    {
        return new float4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    }

    sub(b)
    {
        return new float4(this.x - b.x, this.y - b.y, this.z - b.z, this.w - b.w);
    }

    div(s)
    {
        return new float4(this.x / s, this.y / s, this.z / s, this.w / s);
    }

    neg()
    {
        return new float4(-this.x, -this.y, -this.z, -this.w);
    }

    addEquals(v)
    {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    subEquals(v)
    {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    divEquals(s)
    {
        this.x /= s;
        this.y /= s;
        this.z /= s;
        return this;
    }

    mul(m)
    {
        if(Object(m) instanceof Number && arguments.length === 1)
        {
            return new float4(this.x * m, this.y * m, this.z * m, this.w * m);
        }
        else if(m instanceof mat4x4)
        {
            return new float4(
                this.x * m.m[0] +  this.y * m.m[4] + this.z * m.m[8]  + this.w * m.m[12],
                this.x * m.m[1] +  this.y * m.m[5] + this.z * m.m[9]  + this.w * m.m[13],
                this.x * m.m[2] +  this.y * m.m[6] + this.z * m.m[10] + this.w * m.m[14],
                this.x * m.m[3] +  this.y * m.m[7] + this.z * m.m[11] + this.w * m.m[15],
            );
        }
    }

}

export class mat3x3
{
    constructor(m00 = 0, m01 = 0, m02 = 0, 
                m10 = 0, m11 = 0, m12 = 0,
                m20 = 0, m21 = 0, m22 = 0)
    {
        if(Array.isArray(m00))
        {
            this.m = m00;
        }
        else if(m00 instanceof mat4x4)
        {
            this.m = [m00.m[0], m00.m[1], m00.m[2], 
                      m00.m[4], m00.m[5], m00.m[6],
                      m00.m[8], m00.m[9], m00.m[10]
                    ];
        }
        else
        {
            this.m = [m00, m01, m02,
                      m10, m11, m12,
                      m20, m21, m22];
        }
    }
}

export class mat4x4
{
    constructor(m00 = 0, m01 = 0, m02 = 0, m03 = 0, 
                m10 = 0, m11 = 0, m12 = 0, m13 = 0,
                m20 = 0, m21 = 0, m22 = 0, m23 = 0,
                m30 = 0, m31 = 0, m32 = 0, m33 = 0)
    {
        if(Array.isArray(m00))
        {
            this.m = m00;
        }
        else if(m00 instanceof mat4x4)
        {
            this.m = m00.m;
        }
        else if(m00 instanceof float3 && m01 instanceof float3 && m02 instanceof float3 && m03 instanceof float3)
        {
            this.m = new Array(16);
            this.m[0] = m00.x;
            this.m[1] = m00.y;
            this.m[2] = m00.z;
            this.m[3] = m03.x;

            this.m[4] = m01.x;
            this.m[5] = m01.y;
            this.m[6] = m01.z;
            this.m[7] = m03.y;

            this.m[8]  = m02.x;
            this.m[9]  = m02.y;
            this.m[10] = m02.z;
            this.m[11] = m03.z;

            this.m[12] = 0;
            this.m[13] = 0;
            this.m[14] = 0;
            this.m[15] = 1;

        }
        else
        {
            this.m = [m00, m01, m02, m03, 
                      m10, m11, m12, m13,
                      m20, m21, m22, m23,
                      m30, m31, m32, m33];
        }
    }

    add(m)
    {
        return new mat4x4(this.m.map((s, i) => { return s + m.m[i]; }));
    }

    sub(m)
    {
        return new mat4x4(this.m.map((s, i) => { return s - m.m[i]; }));
    }

    mul(a)
    {
        if(Object(a) instanceof Number)
        {
            return new mat4x4(this.m.map((s, i) => { return s * a; }));
        }
        else if(a instanceof mat4x4)
        {
            let m = new mat4x4();
            m.m[0] = this.m[0] * a.m[0] + this.m[1] * a.m[4] + this.m[2] * a.m[8] + this.m[3] * a.m[12]; 
            m.m[1] = this.m[0] * a.m[1] + this.m[1] * a.m[5] + this.m[2] * a.m[9] + this.m[3] * a.m[13];
            m.m[2] = this.m[0] * a.m[2] + this.m[1] * a.m[6] + this.m[2] * a.m[10] + this.m[3] * a.m[14];
            m.m[3] = this.m[0] * a.m[3] + this.m[1] * a.m[7] + this.m[2] * a.m[11] + this.m[3] * a.m[15];

            m.m[4] = this.m[4] * a.m[0] + this.m[5] * a.m[4] + this.m[6] * a.m[8]  + this.m[7] * a.m[12]; 
            m.m[5] = this.m[4] * a.m[1] + this.m[5] * a.m[5] + this.m[6] * a.m[9]  + this.m[7] * a.m[13];
            m.m[6] = this.m[4] * a.m[2] + this.m[5] * a.m[6] + this.m[6] * a.m[10] + this.m[7] * a.m[14];
            m.m[7] = this.m[4] * a.m[3] + this.m[5] * a.m[7] + this.m[6] * a.m[11] + this.m[7] * a.m[15];

            m.m[8]  = this.m[8] * a.m[0] + this.m[9] * a.m[4] + this.m[10] * a.m[8]  + this.m[11] * a.m[12]; 
            m.m[9]  = this.m[8] * a.m[1] + this.m[9] * a.m[5] + this.m[10] * a.m[9]  + this.m[11] * a.m[13];
            m.m[10] = this.m[8] * a.m[2] + this.m[9] * a.m[6] + this.m[10] * a.m[10] + this.m[11] * a.m[14];
            m.m[11] = this.m[8] * a.m[3] + this.m[9] * a.m[7] + this.m[10] * a.m[11] + this.m[11] * a.m[15];

            m.m[12] = this.m[12] * a.m[0] + this.m[13] * a.m[4] + this.m[14] * a.m[8]  + this.m[15] * a.m[12]; 
            m.m[13] = this.m[12] * a.m[1] + this.m[13] * a.m[5] + this.m[14] * a.m[9]  + this.m[15] * a.m[13];
            m.m[14] = this.m[12] * a.m[2] + this.m[13] * a.m[6] + this.m[14] * a.m[10] + this.m[15] * a.m[14];
            m.m[15] = this.m[12] * a.m[3] + this.m[13] * a.m[7] + this.m[14] * a.m[11] + this.m[15] * a.m[15];
            return m;
        }
    }

    div(value)
    {
        return new mat4x4(this.m.map((s, i) => { return s / value; }));
    }

    addEquals(m)
    {
        this.m = (this.m.map((s, i) => { return this.m[i] + m.m[i]; }));
        return this;
    }

    subEquals(m)
    {
        this.m = (this.m.map((s, i) => { return this.m[i] - m.m[i]; }));
        return this;
    }
    
    divEquals(value)
    {
        this.m = (this.m.map((s, i) => { return this.m[i] / value; }));
        return this;
    }

    identity()
    {
        this.m = [  1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1 ];
        return this;
    }

    transpose()
    {
        return new mat4x4(this.m[0], this.m[4], this.m[8], this.m[12],
                          this.m[1], this.m[5], this.m[9], this.m[13],
                          this.m[2], this.m[6], this.m[10], this.m[14],
                          this.m[3], this.m[7], this.m[11], this.m[15]);
    }

    transposed()
    {
        this.m = [this.m[0], this.m[4], this.m[8], this.m[12],
                  this.m[1], this.m[5], this.m[9], this.m[13],
                  this.m[2], this.m[6], this.m[10], this.m[14],
                  this.m[3], this.m[7], this.m[11], this.m[15]];
        return this;
    }

    static rotateX(theta)
    {
        const M = new mat4x4();

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        M.m[0] = 1;
        M.m[1] = 0;
        M.m[2] = 0;
        M.m[3] = 0;
    
        M.m[4] = 0;
        M.m[5] = cosTheta;
        M.m[6] = sinTheta;
        M.m[7] = 0;
    
        M.m[8]  = 0;
        M.m[9]  = -sinTheta;
        M.m[10] = cosTheta;
        M.m[11] = 0;
    
        M.m[12] = 0;
        M.m[13] = 0;
        M.m[14] = 0;
        M.m[15] = 1;

        return M;
    }

    static rotateY(theta)
    {
        const M = new mat4x4();

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
    
        M.m[0] = cosTheta;
        M.m[1] = 0;
        M.m[2] = -sinTheta;
        M.m[3] = 0;

        M.m[4] = 0;
        M.m[5] = 1;
        M.m[6] = 0;
        M.m[7] = 0;
    
        M.m[8]  = sinTheta;
        M.m[9]  = 0;
        M.m[10] = cosTheta;
        M.m[11] = 0;
    
        M.m[12] = 0;
        M.m[13] = 0;
        M.m[14] = 0;
        M.m[15] = 1;

        return M;
    }

    static rotateZ(theta)
    {
        const M = new mat4x4();

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
    
        M.m[0] = cosTheta;
        M.m[1] = sinTheta;
        M.m[2] = 0;
        M.m[3] = 0;

        M.m[4] = -sinTheta;
        M.m[5] = cosTheta;
        M.m[6] = 0;
        M.m[7] = 0;
    
        M.m[8]  = 0;
        M.m[9]  = 0;
        M.m[10] = 1;
        M.m[11] = 0;
    
        M.m[12] = 0;
        M.m[13] = 0;
        M.m[14] = 0;
        M.m[15] = 1;

        return M;
    }

    static translation(x, y, z)
    {
        return new mat4x4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        );
    }

    static lookTo(position, direction, up)
    {
        const forward = direction.normalize();
        const right = up.cross(forward).normalize();
        up = forward.cross(right);
        const viewPosition = position.neg();

        const translation = new float3(right.dot(viewPosition), up.dot(viewPosition), forward.dot(viewPosition));
        // const m = new mat4x4(right, up, forward, translation);
        const view = new mat4x4();
        
        view.m[0] = right.x;
        view.m[1] = right.y;
        view.m[2] = right.z;
        view.m[3] = translation.x;

        view.m[4] = up.x;
        view.m[5] = up.y;
        view.m[6] = up.z;
        view.m[7] = translation.y;

        view.m[8]  = forward.x;
        view.m[9]  = forward.y;
        view.m[10] = forward.z;
        view.m[11] = translation.z;

        view.m[12] = 0;
        view.m[13] = 0;
        view.m[14] = 0;
        view.m[15] = 1;

        view.transposed();

        return view;
    }

    static lookAt(position, focus, up)
    {
        const direction = position.sub(focus);
        return mat4x4.lookTo(position, direction, up);
    }

    // fov in radians
    static perspective(fov, aspectRatio, near, far)
    {
        const projection = new mat4x4();
        const halfFov = fov * 0.5;
        const tanHalfFov = Math.tan(halfFov);
        const width = 1 / (aspectRatio * tanHalfFov);
        const height = 1 / tanHalfFov;
        const z = (near + far) / (near - far);
        const pz = (2 * near * far) / (near - far);
        const range = far / (far - near);
        
        projection.m[0] = -width;
        projection.m[5] = height;
        projection.m[10] = -range;
        projection.m[11] = -1;
        projection.m[14] = -range * near;
        projection.m[15] = 0;

        // directx
        // projection.m[0] = width;
        // projection.m[5] = height; // webgl needs this positive
        // projection.m[10] = -range;
        // projection.m[11] = 1;
        // projection.m[14] = -range * near;
        // projection.m[15] = 0;
        /*
        projection.m[0] = width;
        projection.m[5] = height;
        projection.m[10] = z;
        projection.m[11] = -1;
        projection.m[14] = pz;
        projection.m[15] = 0;
        */
        return projection;
    }

    static orthographic(width, height, near, far)
    {
        const projection = new mat4x4();
        const range = far / (far - near);
        
        projection.m[0] = -2 / width;
        projection.m[5] = 2 / height;
        projection.m[10] = range;
        projection.m[14] = -range * near;
        projection.m[15] = 1;

        return projection;
    }


    inverse()
	{
		const S0 = this.m[0] * this.m[5]  - this.m[1] * this.m[4];
		const S1 = this.m[0] * this.m[9]  - this.m[1] * this.m[8];
		const S2 = this.m[0] * this.m[13] - this.m[1] * this.m[12];
	
		const S3 = this.m[4] * this.m[9]  - this.m[5] * this.m[8];
		const S4 = this.m[4] * this.m[13] - this.m[5] * this.m[12];
		const S5 = this.m[8] * this.m[13] - this.m[9] * this.m[12];
	
		const C0 = this.m[2] * this.m[7]  - this.m[3] * this.m[6];
		const C1 = this.m[2] * this.m[11] - this.m[3] * this.m[10];
		const C2 = this.m[2] * this.m[15] - this.m[3] * this.m[14];
	
		const C3 = this.m[6]  * this.m[11] - this.m[7]  * this.m[10];
		const C4 = this.m[6]  * this.m[15] - this.m[7]  * this.m[14];
		const C5 = this.m[10] * this.m[15] - this.m[11] * this.m[14];
	
		const det = S0 * C5 - S1 * C4 + S2 * C3 + S3 * C2 - S4 * C1 + S5 * C0;

		if (det === 0.0)
        {
            throw EvalError("Determinant is zero. Cannot calculate inverse.");
        }
		
		const invDet = 1 / det;
		let adj = new mat4x4();
		adj.m[0] = ( this.m[5] * C5 - this.m[9] * C4 + this.m[13] * C3) * invDet;
		adj.m[1] = (-this.m[1] * C5 + this.m[9] * C2 - this.m[13] * C1) * invDet;
		adj.m[2] = ( this.m[1] * C4 - this.m[5] * C2 + this.m[13] * C0) * invDet;
		adj.m[3] = (-this.m[1] * C3 + this.m[5] * C1 - this.m[9]  * C0) * invDet;
	
		adj.m[4] = (-this.m[4] * C5 + this.m[8] * C4 - this.m[12] * C3) * invDet;
		adj.m[5] = ( this.m[0] * C5 - this.m[8] * C2 + this.m[12] * C1) * invDet;
		adj.m[6] = (-this.m[0] * C4 + this.m[4] * C2 - this.m[12] * C0) * invDet;
		adj.m[7] = ( this.m[0] * C3 - this.m[4] * C1 + this.m[8]  * C0) * invDet;
	
		adj.m[8]  = ( this.m[7] * S5 - this.m[11] * S4 + this.m[15] * S3) * invDet;
		adj.m[9]  = (-this.m[3] * S5 + this.m[11] * S2 - this.m[15] * S1) * invDet;
		adj.m[10] = (+this.m[3] * S4 - this.m[7]  * S2 + this.m[15] * S0) * invDet;
		adj.m[11] = (-this.m[3] * S3 + this.m[7]  * S1 - this.m[11] * S0) * invDet;
	
		adj.m[12] = (-this.m[6] * S5 + this.m[10] * S4 - this.m[14] * S3) * invDet;
		adj.m[13] = ( this.m[2] * S5 - this.m[10] * S2 + this.m[14] * S1) * invDet;
		adj.m[14] = (-this.m[2] * S4 + this.m[6]  * S2 - this.m[14] * S0) * invDet;
		adj.m[15] = ( this.m[2] * S3 - this.m[6]  * S1 + this.m[10] * S0) * invDet;
	
		return adj;
	}

    static identity()
    {
        return new mat4x4(1, 0, 0, 0,
                          0, 1, 0 ,0,
                          0, 0, 1, 0,
                          0 ,0 ,0, 1
        );
    }
}

export class OrthonormalBasis
{
    constructor(u = [1, 0, 0], v = [0, 1, 0], w = [0, 0, 1])
    {
        this.u = new float3(u);
        this.v = new float3(v);
        this.w = new float3(w);
    }

    toLocal(v)
    {
	    return new float3(this.u.dot(v), this.v.dot(v), this.w.dot(v));
    }

    toWorld(v)
    {
        return new float3(this.u.mul(v.x).add(this.v.mul(v.y)).add(this.w.mul(v.z)));
    }
    
    static fromW(n)
    {
        let basis = new OrthonormalBasis();
        basis.w = normalize(n);
        const s = n.z >= 0.0 ? 1.0 : -1.0;
        const a = -1.0 / (s + n.z);
        const b = n.x * n.y * a;
        basis.u = new float3(1.0 + s * n.x * n.x * a, s * b, -s * n.x);
        basis.v = new float3(b, s + n.y * n.y * a, -n.y);
        return basis;
    }

    static fromU(n)
    {
        let basis = new OrthonormalBasis();
        basis.u = normalize(n);
        const s = n.z >= 0.0 ? 1.0 : -1.0;
        const a = -1.0 / (s + n.z);
        const b = n.x * n.y * a;
        basis.v = new float3(1.0 + s * n.x * n.x * a, s * b, -s * n.x);
        basis.w = new float3(b, s + n.y * n.y * a, -n.y);
        return basis;
    }
}

export class Camera
{
    constructor(fov, aspectRatio, near, far)
    {
        this.position = new float3(0, 0, -3);
        this.direction = new float3(0, 0, -1);
        this.world = new mat4x4();
        this.view = new mat4x4();
        this.projection = new mat4x4();
        this.projectionInverse = new mat4x4();
        this.focus = new float3(0, 0, 0);
        this.distance = 3;
        this.fov = fov;
        this.aspectRatio = aspectRatio;
        this.near = near;
        this.far = far;


        this.right = new float3(1, 0, 0);
        this.up = new float3(0, 1, 0);
        this.forward = new float3(0, 0, 1);
        this.dx = 0;
        this.dy = 0;
        this.rotation = new float3(0, 0, 0);
        this.movement = new float3(0, 0, 0);
    }

    onMouse(dx, dy, button)
    {
        // if(dx === 0 || dy === 0)
            // return;
        // this.dx = dx;
        // this.dy = dy;
        if(button === 0)
        {
            this.rotation.x += dy * 0.25;
            this.rotation.y += dx * 0.25;
        }
        else if(button === 1)
        {
            this.movement.x = -dx * 0.01;
            this.movement.y = dy * 0.01;
        }

        // let forward = this.focus.sub(this.position).normalize();
        // let transform = rollPitchYawMatrix(dy* 0.01, dx* 0.01, 0);
        // this.position = forward.mul(transform).mul(this.distance);
    }

    update(deltaTime)
    {
        // this.forward = this.focus.sub(this.position).normalize();
        this.forward = new float3(0, 0, 1);
        let transform = rollPitchYawMatrix(degToRad(this.rotation.x), degToRad(this.rotation.y), degToRad(this.rotation.z));
        this.forward = this.forward.mul(transform).normalize();
        this.position = this.forward.mul(this.distance);
        this.up = new float3(0, 1, 0);
        this.up = this.up.mul(transform).normalize();
        this.right = this.up.cross(this.forward);
        this.up = this.forward.cross(this.right);
        
        // this.position.addEquals(this.right.mul(this.movement.x));
        // this.position.addEquals(this.up.mul(this.movement.y));
        this.focus.addEquals(this.right.mul(this.movement.x));
        this.focus.addEquals(this.up.mul(this.movement.y));
        this.position = this.focus.sub(this.forward.mul(this.distance));

        this.view = mat4x4.lookAt(this.position, this.focus, this.up);
        this.projection = mat4x4.perspective(this.fov, this.aspectRatio, this.near, this.far);
        this.dx = 0;
        this.dy = 0;
        this.movement.x = 0;
        this.movement.y = 0;
    }
}

export class OrthographicCamera
{
    constructor(width, height, near, far)
    {
        this.position = new float3(0, 0, -2);
        this.direction = new float3(0, 0, -1);
        this.world = new mat4x4();
        this.view = new mat4x4();
        this.projection = new mat4x4();
        this.projectionInverse = new mat4x4();
        this.focus = new float3(0, 0, 0);
        this.distance = 1;
        this.width = width;
        this.height = height;
        this.near = near;
        this.far = far;

        this.right = new float3(1, 0, 0);
        this.up = new float3(0, 1, 0);
        this.forward = new float3(0, 0, 1);
        this.dx = 0;
        this.dy = 0;
        this.rotation = new float3(0, 0, 0);
        this.movement = new float3(0, 0, 0);
        this.fudge = 0;
        this.fudge1 = 0;
    }

    onMouse(dx, dy, button)
    {
        // if(dx === 0 || dy === 0)
            // return;
        // this.dx = dx;
        // this.dy = dy;
        if(button === 0)
        {
            
            this.rotation.x += dy * 0.25;
            this.rotation.y += dx * 0.25;

        }
        else if(button === 1)
        {
            this.movement.x = -dx * 0.01;
            this.movement.y = dy * 0.01;
        }

        // let forward = this.focus.sub(this.position).normalize();
        // let transform = rollPitchYawMatrix(dy* 0.01, dx* 0.01, 0);
        // this.position = forward.mul(transform).mul(this.distance);
    }

    update(deltaTime)
    {
        // this.forward = this.focus.sub(this.position).normalize();
        this.forward = new float3(0, 0, 1);
        let transform = rollPitchYawMatrix(degToRad(this.rotation.x), degToRad(this.rotation.y + this.fudge), degToRad(this.rotation.z + this.fudge1));
        this.forward = this.forward.mul(transform).normalize();
        this.position = this.forward.mul(this.distance);
        this.up = new float3(0, 1, 0);
        this.up = this.up.mul(transform).normalize();
        this.right = this.up.cross(this.forward);
        this.up = this.forward.cross(this.right);
        
        // this.position.addEquals(this.right.mul(this.movement.x));
        // this.position.addEquals(this.up.mul(this.movement.y));
        this.focus.addEquals(this.right.mul(this.movement.x));
        this.focus.addEquals(this.up.mul(this.movement.y));
        this.position = this.focus.sub(this.forward.mul(this.distance));

        this.view = mat4x4.lookAt(this.position, this.focus, this.up);
        this.projection = mat4x4.orthographic(this.width / this.distance, this.height / this.distance, this.near, this.far);
        this.dx = 0;
        this.dy = 0;
        this.movement.x = 0;
        this.movement.y = 0;
    }
}

export class Quaternion
{
    constructor(x = 0, y = 0, z = 0, w = 0)
    {
        if(Object(x) instanceof Number && arguments.length === 1)
        {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = x;
        }
        else if(x instanceof float4)
        {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
            this.w = x.w;
        }
        else if(x instanceof float3)
        {
            const cosTheta = Math.cos(y * 0.5);
            const sinTheta = Math.sin(y * 0.5);
            this.x = sinTheta * x.x;
            this.y = sinTheta * x.y;
            this.z = sinTheta * x.z;
            this.w = cosTheta;
        }
        else if(x instanceof Quaternion)
        {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
            this.w = x.w;
        }
        else
        {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
    }

    add(q)
    {
        // if(Object(q) instanceof Number)
        // {
        //     return new Quaternion(this.x, this.y, this.z, this.w + q);
        // }
        return new Quaternion(this.x + q.x, this.y + q.y, this.z + q.z, this.w + q.w);
    }

    sub(q)
    {
        return new Quaternion(this.x - q.x, this.y - q.y, this.z - q.z, this.w - q.w);
    }

    mul(q)
    {
        if(Object(q) instanceof Number)
        {
            return new Quaternion(this.x * q, this.y * q, this.z * q, this.w * q);
        }
        else if(q instanceof Quaternion)
        {
            return new Quaternion(
                this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
                this.w * q.y + this.y * q.w + this.z * q.x - this.x * q.z,
                this.w * q.z + this.z * q.w + this.x * q.y - this.y * q.x,
                this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
            );
        }
        
        throw TypeError("Argument type does not support quaternion multiplication.");
    }

    cross(v)
	{
		return new float3(this.y * v.z - v.y * this.z, v.x * this.z - this.x * v.z, this.x * v.y - this.y * v.x);
	}

    div(s)
    {
        const divisor = 1 / s;
        return new Quaternion(this.x * divisor, this.y  * divisor, this.z * divisor, this.w  * divisor);
    }

    conjugate()
    {
        return new Quaternion(-this.x, -this.y, -this.z, this.w);
    }

    length()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    lengthSquared()
    {
        return (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    normalize()
    {
        const length = this.length();
        return new Quaternion(
            this.x / length,
            this.y / length,
            this.z / length,
            this.w / length
        );
    }

    rotate(v)
    {
        const p = new Quaternion(v);
        const q_conj = this.conjugate();
        const qp_conj = p.mul(q_conj);
        const result = this.mul(qp_conj);
        return new float3(result.x, result.y, result.z);
    }

    dot(q)
    {
        return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    }

    inverse()
    {
        return this.conjugate().div(this.lengthSquared());
    }

    negate()
    {
        return new Quaternion(-this.x, -this.y, -this.z, -this.w);
    }

    static identity()
    {
        return new Quaternion(0, 0, 0, 1);
    }

    toMatrix()
    {
        return new mat4x4(1 - 2 * this.y * this.y - 2 * this.z * this.z, 2 * this.x * this.y - 2 * this.w * this.z, 2 * this.x * this.z + 2 * this.w * this.y, 0,
                2 * this.x * this.y + 2 * this.w * this.z, 1 - 2 * this.x * this.x - 2 * this.z * this.z, 2 * this.y * this.z - 2 * this.w * this.x, 0,
                2 * this.x * this.z - 2 * this.w * this.y, 2 * this.y * this.z + 2 * this.w * this.x, 1 - 2 * this.x * this.x - 2 * this.y * this.y, 0,
                0, 0, 0, 1
        ).transpose();
    }
}

export class ObjModel
{
    constructor()
    {
        this.indices = [];
        this.positions = [];
        this.normals = [];
        this.uvs = [];
        this.vertices = [];
        this.uvIndices = [];
        this.normalIndices = [];

    }

    async load(file)
    {
        const response = await fetch(file);
        const obj = await response.text();
        const lines = obj.split("\n");

        // const vertices = [];
        // const normals = [];
        // const uvs = [];
        // const indices = [];

        for(let i = 0; i < lines.length; ++i)
        {
            const line = lines[i];
            if(line.charAt(0) === 'v' && line.charAt(1) === ' ')
            {
                this.positions.push(line.slice(1, line.length).trim().split(' ').map(x => Number(x)));
            }
            else if(line.charAt(0) === 'v' && line.charAt(1) === 't')
            {
                this.uvs.push(line.slice(2, line.length).trim().split(' ').map(x => Number(x)));
            }
            else if(line.charAt(0) === 'v' && line.charAt(1) === 'n')
            {
                this.normals.push(line.slice(2, line.length).trim().split(' ').map(x => Number(x)));
            }
            else if(line.charAt(0) === 'f' && line.charAt(1) === ' ')
            {
                let triangles = line.slice(1, line.length).trim().split(' ');

                for(let j = 0; j < triangles.length; j++)
                {
                    let triangleIndices = triangles[j].split('/');
                    // console.log(triangleIndices[2]);

                    // this.indices.push([Number(triangleIndices[0]), Number(triangleIndices[1]), Number(triangleIndices[2])]);
                    // triangleIndices.reverse();
                    for(let k = 0; k < triangleIndices.length; ++k)
                    {
                        // this.indices.push(Number(triangleIndices[k]));
                    }
                    this.indices.push(Number(triangleIndices[0]) - 1);
                    this.uvIndices.push(Number(triangleIndices[1]) - 1);
                    this.normalIndices.push(Number(triangleIndices[2]) - 1);
                    
                }
                // indices.push(line.slice(1, line.length).trim().split(' ').split('/').map(x => Number(x)));
                
            }

        }

        for(let i = 0; i < this.indices.length; i += 1)
        {
            this.vertices.push(this.positions[this.indices[i]]);
            this.vertices.push(this.normals[this.normalIndices[i]]);
            
        }

    }
}

export class Ray
{
    constructor(origin, direction)
    {
        this.origin = origin;
        this.direction = direction;
    }

    atDistance(t)
    {
        return this.origin.add(this.direction.mul(t));
    }
}

export class LineSegment
{
    constructor(a, b)
    {
        this.a = a;
        this.b =b;
    }
    
    intersect(ray, tMin, tMax)
    {
        const s = this.b.sub(this.a);
        const t = this.a.sub(ray.origin).cross(s) / ray.direction.cross(s);
        const u = this.a.sub(ray.origin).cross(ray.direction) / ray.direction.cross(s);

        if(t > 0 && t <= 1 && u > 0 && u <= 1)
        {
            const n = normalize(new float2(-s.y, s.x));
            return {hit:true, position: ray.atDistance(t), normal: n, t: t};
        }

        return {hit:false};
    }
}

export class CylinderY
{
    constructor(center, radius, height)
    {
        this.center = center;
        this.radius = radius;
        this.height = height;
    }

    intersect(ray, tMin, tMax)
    {
        const localRay = ray;
        localRay.origin = localRay.origin.sub(this.center);
        const ox = ray.origin.x;
        const oy = ray.origin.y;
        const oz = ray.origin.z;
        const dx = ray.direction.x;
        const dy = ray.direction.y;
        const dz = ray.direction.z;
        const A = dx * dx + dz * dz;
        const B = 2 * (dx * ox + dz * oz);
        const C = ox * ox + oz * oz - this.radius * this.radius;

        let discriminant = B * B - 4 * A * C;

        if (discriminant <= 0)
        {
            return false;
        }

        discriminant = Math.sqrt(discriminant);

        let t0 = 0;
        let t1 = -0.5 * B / A;

        if (discriminant > 0)
        {
            const q = B > 0 ? -0.5 * (B + discriminant) : -0.5 * (B - discriminant);
            t0 = q / A;
            t1 = C / q;
        }
        const isInside = false;
        if (t0 > t1)
        {
            [t0, t1] = [t1, t0];
        }
        let t = t0;
        if (t <= 0)
        {
            t = t1;
        }

        t = Math.min(t0, t1);
        const position = localRay.atDistance(t);

        if (position.y < -this.height || position.y > this.height)
        {
            return false;
        }

        const theta = Math.acos(clamp(position.y / this.radius, -1, 1));
        const phi = Math.atan2(position.z, position.x);

        const phiMax = 2 * Math.PI;
        const u = phi / (2.0 * Math.PI);
        const v = position.y / this.height;

        const yMax = this.height;
        const yMin = -this.height;
        const  dpdu = new float3(-phiMax * position.z, 0, phiMax * position.x);
        const  dpdv = new float3(0, yMax - yMin, 0);
        const  normal = normalize(cross(dpdu, dpdv));
        if (t >= tMin && t <= tMax)
        {
            tMax = t;
            // out_position = position;
            // out_normal = normalize(cross(dpdu, dpdv));

            return {hit:true, position: position, normal: normalize(cross(dpdu, dpdv)).neg()};
        }

        return {hit:false};
    }
}

export class Cylinder
{
    constructor(center, radius, height)
    {
        this.center = center;
        this.radius = radius;
        this.height = height;
    }

    intersect(ray, tMin, tMax)
    {
        const localRay = ray;
        localRay.origin = localRay.origin.sub(this.center);
        const ox = ray.origin.x;
        const oy = ray.origin.y;
        const oz = ray.origin.z;
        const dx = ray.direction.x;
        const dy = ray.direction.y;
        const dz = ray.direction.z;
        const A = dx * dx + dy * dy;
        const B = 2 * (dx * ox + dy * oy);
        const C = ox * ox + oy * oy - this.radius * this.radius;

        let discriminant = B * B - 4 * A * C;

        if (discriminant <= 0)
        {
            return false;
        }

        discriminant = Math.sqrt(discriminant);

        let t0 = 0;
        let t1 = -0.5 * B / A;

        if (discriminant > 0)
        {
            const q = B > 0 ? -0.5 * (B + discriminant) : -0.5 * (B - discriminant);
            t0 = q / A;
            t1 = C / q;
        }
        const isInside = false;
        if (t0 > t1)
        {
            [t0, t1] = [t1, t0];
        }
        let t = t0;
        if (t <= 0)
        {
            t = t1;
        }

        t = Math.min(t0, t1);
        const position = localRay.atDistance(t);

        if (position.z < -this.height || position.z > this.height)
        {
            return false;
        }

        const theta = Math.acos(clamp(position.y / this.radius, -1, 1));
        const phi = Math.atan2(position.z, position.x);

        const phiMax = 2 * Math.PI;
        const u = phi / (2.0 * Math.PI);
        const v = position.z / this.height;

        const zMax = this.height;
        const zMin = -this.height;
        const  dpdu = new float3(-phiMax * position.y, phiMax * position.x, 0);
        const  dpdv = new float3(0, 0, zMax - zMin);
        const  normal = normalize(cross(dpdu, dpdv));
        if (t >= tMin && t <= tMax)
        {
            tMax = t;
            // out_position = position;
            // out_normal = normalize(cross(dpdu, dpdv));

            return {hit:true, position: position, normal: normalize(cross(dpdu, dpdv))};
        }

        return {hit:false};
    }
}


export class Sphere
{
    constructor(center, radius)
    {
        this.center = center;
        this.radius = radius;
    }

    intersect(ray, tMin, tMax)
    {
        const localRay = ray;
        const OC = localRay.origin.sub(this.center);
        const A = dot(ray.direction, ray.direction);
        const B = 2 * dot(OC, ray.direction);
        const C = dot(OC, OC) - this.radius * this.radius;

        let discriminant = B * B - 4 * A * C;

        if (discriminant <= 0)
        {
            return false;
        }

        discriminant = Math.sqrt(discriminant);

        let t0 = (-B - discriminant) / (2 * A);
        let t1 = (-B + discriminant) / (2 * A);
        
        if (t0 > t1)
        {
            [t0, t1] = [t1, t0];
        }
        if (t1 < tMin || t0 > tMax)
        {
            return false;
        }
        
        let t = t0 < 0 ? t1 : t0;
        // t = (t0 < tMax) ? t1 : t0;
        if (t > tMax)
        {
            return false;
        }
        const position = localRay.atDistance(t);

        const theta = Math.acos(clamp(position.y / this.radius, -1, 1));
        const phi = Math.atan2(position.z, position.x);

        const phiMax = 2 * Math.PI;
        const u = phi / (2.0 * Math.PI);
        const v = position.z / this.height;

        if (t >= tMin && t <= tMax)
        {
            tMax = t;
            // out_position = position;
            // out_normal = normalize(cross(dpdu, dpdv));
            return {hit:true, position: position, normal: normalize(normalize(position.sub(this.center)))};
        }

        return {hit:false};
    }
}

export class Plane
{
    constructor(origin, normal)
    {
        this.origin = origin;
        this.normal = normal;
    }

    intersect(ray)
    {
        const Numerator = dot(this.normal, this.origin.sub(ray.origin));
        const Denominator = dot(this.normal, ray.direction);
        const t = (Numerator / Denominator);
        if (t > 0.00001)
        {
            return {hit: true, position: ray.atDistance(t), normal: this.normal};
        }
        return {hit: false};
    }
}

export function dot(a, b)
{
    return a.dot(b);
}
export function normalize(x)
{
    return x.normalize();
}

export function mul(a, b)
{
    return a.mul(b);
}

export function degToRad(x)
{
    return x * Math.PI / 180;
}

export function radToDeg(x)
{
    return x * 180 / Math.PI;
}

export function degrees(x)
{
    return x * 180 / Math.PI;
}

export function radians(x)
{
    return x * Math.PI / 180;
}

export function rotate(v, q)
{
    const p = new Quaternion(v);
    const q_conj = q.conjugate();
    const qp_conj = p.mul(q_conj);
    return q.mul(qp_conj);
}

export function cross(a, b)
{
    return a.cross(b);
}

// https://learn.microsoft.com/en-us/windows/win32/api/directxmath/nf-directxmath-xmquaternionrotationrollpitchyawfromvector
export function rollPitchYawQuat(pitch, yaw, roll)
{
    const qx = new Quaternion(new float3(1, 0, 0), pitch);
    const qy = new Quaternion(new float3(0, 1, 0), yaw);
    const qz = new Quaternion(new float3(0, 0, 1), roll);

    // order of transformation is roll, pitch, then yaw
    const q = qy.mul(qx).mul(qz);
    return q;
    const rotation = q.toMatrix();
    return rotation; 
}

export function rollPitchYawMatrix(pitch, yaw, roll)
{
    const qx = new Quaternion(new float3(1, 0, 0), pitch);
    const qy = new Quaternion(new float3(0, 1, 0), yaw);
    const qz = new Quaternion(new float3(0, 0, 1), roll);

    // order of transformation is roll, pitch, then yaw
    const q = qy.mul(qx).mul(qz);
    const rotation = q.toMatrix();
    return rotation; 
}

export function axisRotationQuat(axis, angle)
{
    const v = axis.normalize();
    const sinTheta = Math.sin(angle * 0.5);
    const cosTheta = Math.cos(angle * 0.5);
    const q = new Quaternion(v.x * sinTheta, v.y * sinTheta, v.z * sinTheta, cosTheta)
    return q;
}

export function axisRotationMatrix(axis, angle)
{
    const v = axis.normalize();
    const sinTheta = Math.sin(angle);
    const cosTheta = Math.cos(angle);
    
    return new mat4x4(
        (1 - cosTheta) * v.x * v.x + cosTheta,       (1 - cosTheta) * v.x * v.y - sinTheta * v.z, (1 - cosTheta) * v.x * v.z + sinTheta * v.y, 0,
        (1 - cosTheta) * v.x * v.y + sinTheta * v.z, (1 - cosTheta) * v.y * v.y + cosTheta,       (1 - cosTheta) * v.y * v.z - sinTheta * v.x, 0,
        (1 - cosTheta) * v.x * v.z - sinTheta * v.y, (1 - cosTheta) * v.y * v.z + sinTheta * v.x, (1 - cosTheta) * v.z * v.z + cosTheta      , 0,
        0                                          , 0                                          , 0                                          , 1     
    ).transpose();
}

export function clamp(x, a, b)
{
    return Math.min(Math.max(x, a), b);
}

export function refract(wi, n, ior)
{
    const wiDotN = dot(wi, n);
    let cosThetaT = 1 - ior * ior * ( 1 - wiDotN * wiDotN);
    if(cosThetaT <= 0)
    {
        return new float3(0, 0, 0);
    }
    cosThetaT = Math.sqrt(cosThetaT);
    let R = ior * wiDotN + cosThetaT;

    let result = wi.mul(ior).sub(n.mul(R));
    return result;
}

export function reflect(I, N)
{
    return N.mul(2 * dot(I, N)).sub(I);
}

export function negative(x)
{
    return x.neg();
}

export function project(a, b)
{
	// return dot(a, b) / dot(b, b) * b;
    return mul(b, dot(a, b) / dot(b, b));
}

export function projectToPlane(a, n)
{
	return a.sub(project(a, n));
}

export function distance(a, b)
{
    return a.distance(b);
}

export function length(a)
{
    return a.length();
}

export function smoothstep(a, b, x)
{
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - ( 2 * t));
}