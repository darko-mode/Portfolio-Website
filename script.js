// --- Animated Background JavaScript ---
// Adapted from the React OGL component logic
(function() {
    const canvas = document.getElementById('animated-bg-canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    // Vertex shader source
    const vertexShaderSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    // Fragment shader source (the complex animation logic)
    const fragmentShaderSource = `
        #ifdef GL_ES
        precision lowp float;
        #endif
        uniform vec2 uResolution;
        uniform float uTime;

        // --- Helper Functions and Constants from the original code ---
        vec3 rgb2yiq = vec3(0.299, 0.587, 0.114);
        vec2 yiq2rgb = vec2(1.0, 0.956);

        float rand(vec2 c) {
            return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec3 hueShiftRGB(vec3 col, float deg) {
            float rad = radians(deg);
            float cosh = cos(rad);
            float sinh = sin(rad);
            vec2 yiq = vec2(dot(col, rgb2yiq), dot(col.yzx, vec3(0.596, -0.274, -0.322)));
            vec2 yiqShift = vec2(yiq.x, yiq.y * cosh - yiq.y * sinh); // Simplified rotation
            return clamp(col + vec3(0.0, (yiqShift.y - yiq.y) * yiq2rgb.x, (yiqShift.y - yiq.y) * yiq2rgb.y), 0.0, 1.0);
        }

        vec4 sigmoid(vec4 x) {
            return 1.0 / (1.0 + exp(-x));
        }

        vec4 cppn_fn(vec2 coordinate, float in0, float in1, float in2) {
            // Buffer declarations
            vec4 buf0, buf1, buf2, buf3, buf4, buf5, buf6, buf7;

            // Initial setup
            buf6 = vec4(coordinate.x, coordinate.y, 0.3948333106474662 + in0, 0.36 + in1);
            buf7 = vec4(0.14 + in2, sqrt(coordinate.x * coordinate.x + coordinate.y * coordinate.y), 0.0, 0.0);

            // Layer 1
            buf0 = mat4(vec4(6.5404263, -3.6126034, 0.7590882, -1.13613),
                        vec4(2.4582713, 3.1660357, 1.2219609, 0.06276096),
                        vec4(-5.478085, -6.159632, 1.8701609, -4.7742867),
                        vec4(6.039214, -5.542865, -0.90925294, 3.251348)) * buf6 +
                      mat4(vec4(0.8473259, -5.722911, 3.975766, 1.6522468),
                            vec4(-0.24321538, 0.5839259, -1.7661959, -5.350116),
                            vec4(0.0, 0.0, 0.0, 0.0),
                            vec4(0.0, 0.0, 0.0, 0.0)) * buf7 +
                      vec4(0.21808943, 1.1243913, -1.7969975, 5.0294676);

            buf1 = mat4(vec4(-3.3522482, -6.0612736, 0.55641043, -4.4719114),
                        vec4(0.8631464, 1.7432913, 5.643898, 1.6106541),
                        vec4(2.4941394, -3.5012043, 1.7184316, 6.357333),
                        vec4(3.310376, 8.209261, 1.1355612, -1.165539)) * buf6 +
                      mat4(vec4(5.24046, -13.034365, 0.009859298, 15.870829),
                            vec4(2.987511, 3.129433, -0.89023495, -1.6822904),
                            vec4(0.0, 0.0, 0.0, 0.0),
                            vec4(0.0, 0.0, 0.0, 0.0)) * buf7 +
                      vec4(-5.9457836, -6.573602, -0.8812491, 1.5436668);

            buf0 = sigmoid(buf0);
            buf1 = sigmoid(buf1);

            // Layer 2
            buf2 = mat4(vec4(-15.219568, 8.095543, -2.429353, -1.9381982),
                        vec4(-5.951362, 4.3115187, 2.6393783, 1.274315),
                        vec4(-7.3145227, 6.7297835, 5.2473326, 5.9411426),
                        vec4(5.0796127, 8.979051, -1.7278991, -1.158976)) * buf6 +
                      mat4(vec4(-11.967154, -11.608155, 6.1486754, 11.237008),
                            vec4(2.124141, -6.263192, -1.7050359, -0.7021966),
                            vec4(0.0, 0.0, 0.0, 0.0),
                            vec4(0.0, 0.0, 0.0, 0.0)) * buf7 +
                      vec4(-4.17164, -3.2281182, -4.576417, -3.6401186);

            buf3 = mat4(vec4(3.1832156, -13.738922, 1.879223, 3.233465),
                        vec4(0.64300746, 12.768129, 1.9141049, 0.50990224),
                        vec4(-0.049295485, 4.4807224, 1.4733979, 1.801449),
                        vec4(5.0039253, 13.000481, 3.3991797, -4.5561905)) * buf6 +
                      mat4(vec4(-0.1285731, 7.720628, -3.1425676, 4.742367),
                            vec4(0.6393625, 3.714393, -0.8108378, -0.39174938),
                            vec4(0.0, 0.0, 0.0, 0.0),
                            vec4(0.0, 0.0, 0.0, 0.0)) * buf7 +
                      vec4(-1.1811101, -21.621881, 0.7851888, 1.2329718);

            buf2 = sigmoid(buf2);
            buf3 = sigmoid(buf3);

            // Layer 3
            buf4 = mat4(vec4(5.214916, -7.183024, 2.7228765, 2.6592617),
                        vec4(-5.601878, -25.3591, 4.067988, 0.4602802),
                        vec4(-10.57759, 24.286327, 21.102104, 37.546658),
                        vec4(4.3024497, -1.9625226, 2.3458803, -1.372816)) * buf0 +
                      mat4(vec4(-17.6526, -10.507558, 2.2587414, 12.462782),
                            vec4(6.265566, -502.75443, -12.642513, 0.9112289),
                            vec4(-10.983244, 20.741234, -9.701768, -0.7635988),
                            vec4(5.383626, 1.4819539, -4.1911616, -4.8444734)) * buf1 +
                      mat4(vec4(12.785233, -16.345072, -0.39901125, 1.7955981),
                            vec4(-30.48365, -1.8345358, 1.4542528, -1.1118771),
                            vec4(19.872723, -7.337935, -42.941723, -98.52709),
                            vec4(8.337645, -2.7312303, -2.2927687, -36.142323)) * buf2 +
                      mat4(vec4(-16.298317, 3.5471997, -0.44300047, -9.444417),
                            vec4(57.5077, -35.609753, 16.163465, -4.1534753),
                            vec4(-0.07470326, -3.8656476, -7.0901804, 3.1523974),
                            vec4(-12.559385, -7.077619, 1.490437, -0.8211543)) * buf3 +
                      vec4(-7.67914, 15.927437, 1.3207729, -1.6686112);

            buf5 = mat4(vec4(-1.4109162, -0.372762, -3.770383, -21.367174),
                        vec4(-6.2103205, -9.35908, 0.92529047, 8.82561),
                        vec4(11.460242, -22.348068, 13.625772, -18.693201),
                        vec4(-0.3429052, -3.9905605, -2.4626114, -0.45033523)) * buf0 +
                      mat4(vec4(7.3481627, -4.3661838, -6.3037653, -3.868115),
                            vec4(1.5462853, 6.5488915, 1.9701879, -0.58291394),
                            vec4(6.5858274, -2.2180402, 3.7127688, -1.3730392),
                            vec4(-5.7973905, 10.134961, -2.3395722, -5.965605)) * buf1 +
                      mat4(vec4(-2.5132585, -6.6685553, -1.4029363, -0.16285264),
                            vec4(-0.37908727, 0.53738135, 4.389061, -1.3024765),
                            vec4(-0.70647055, 2.0111287, -5.1659346, -3.728635),
                            vec4(-13.562562, 10.487719, -0.9173751, -2.6487076)) * buf2 +
                      mat4(vec4(-8.645013, 6.5546675, -6.3944063, -5.5933375),
                            vec4(-0.57783127, -1.077275, 36.91025, 5.736769),
                            vec4(14.283112, 3.7146652, 7.1452246, -4.5958776),
                            vec4(2.7192075, 3.6021907, -4.366337, -2.3653464)) * buf3 +
                      vec4(-5.9000807, -4.329569, 1.2427121, 8.59503);

            buf4 = sigmoid(buf4);
            buf5 = sigmoid(buf5);

            // Layer 4
            buf6 = mat4(vec4(-1.61102, 0.7970257, 1.4675229, 0.20917463),
                        vec4(-28.793737, -7.1390953, 1.5025433, 4.656581),
                        vec4(-10.94861, 39.66238, 0.74318546, -10.095605),
                        vec4(-0.7229728, -1.5483948, 0.7301322, 2.1687684)) * buf0 +
                      mat4(vec4(3.2547753, 21.489103, -1.0194173, -3.3100595),
                            vec4(-3.7316632, -3.3792162, -7.223193, -0.23685838),
                            vec4(13.1804495, 0.7916005, 5.338587, 5.687114),
                            vec4(-4.167605, -17.798311, -6.815736, -1.6451967)) * buf1 +
                      mat4(vec4(0.604885, -7.800309, -7.213122, -2.741014),
                            vec4(-3.522382, -0.12359311, -0.5258442, 0.43852118),
                            vec4(9.6752825, -22.853785, 2.062431, 0.099892326),
                            vec4(-4.3196306, -17.730087, 2.5184598, 5.30267)) * buf2 +
                      mat4(vec4(-6.545563, -15.790176, -6.0438633, -5.415399),
                            vec4(-43.591583, 28.551912, -16.00161, 18.84728),
                            vec4(4.212382, 8.394307, 3.0958717, 8.657522),
                            vec4(-5.0237565, -4.450633, -4.4768, -5.5010443)) * buf3 +
                      mat4(vec4(1.6985557, -67.05806, 6.897715, 1.9004834),
                            vec4(1.8680354, 2.3915145, 2.5231109, 4.081538),
                            vec4(11.158006, 1.7294737, 2.0738268, 7.386411),
                            vec4(-4.256034, -306.24686, 8.258898, -17.132736)) * buf4 +
                      mat4(vec4(1.6889864, -4.5852966, 3.8534803, -6.3482175),
                            vec4(1.3543309, -1.2640043, 9.932754, 2.9079645),
                            vec4(-5.2770967, 0.07150358, -0.13962056, 3.3269649),
                            vec4(28.34703, -4.918278, 6.1044083, 4.085355)) * buf5 +
                      vec4(6.6818056, 12.522166, -3.7075126, -4.104386);

            buf7 = mat4(vec4(-8.265602, -4.7027016, 5.098234, 0.7509808),
                        vec4(8.6507845, -17.15949, 16.51939, -8.884479),
                        vec4(-4.036479, -2.3946867, -2.6055532, -1.9866527),
                        vec4(-2.2167742, -1.8135649, -5.9759874, 4.8846445)) * buf0 +
                      mat4(vec4(6.7790847, 3.5076547, -2.8191125, -2.7028968),
                            vec4(-5.743024, -0.27844876, 1.4958696, -5.0517144),
                            vec4(13.122226, 15.735168, -2.9397483, -4.101023),
                            vec4(-14.375265, -5.030483, -6.2599335, 2.9848232)) * buf1 +
                      mat4(vec4(4.0950394, -0.94011575, -5.674733, 4.755022),
                            vec4(4.3809423, 4.8310084, 1.7425908, -3.437416),
                            vec4(2.117492, 0.16342592, -104.56341, 16.949184),
                            vec4(-5.22543, -2.994248, 3.8350096, -1.9364246)) * buf2 +
                      mat4(vec4(-5.900337, 1.7946124, -13.604192, -3.8060522),
                            vec4(6.6583457, 31.911177, 25.164474, 91.81147),
                            vec4(11.840538, 4.1503043, -0.7314397, 6.768467),
                            vec4(-6.3967767, 4.034772, 6.1714606, -0.32874924)) * buf3 +
                      mat4(vec4(3.4992442, -196.91893, -8.923708, 2.8142626),
                            vec4(3.4806502, -3.1846354, 5.1725626, 5.1804223),
                            vec4(-2.4009497, 15.585794, 1.2863957, 2.0252278),
                            vec4(-71.25271, -62.441242, -8.138444, 0.50670296)) * buf4 +
                      mat4(vec4(-12.291733, -11.176166, -7.3474145, 4.390294),
                            vec4(10.805477, 5.6337385, -0.9385842, -4.7348723),
                            vec4(-12.869276, -7.039391, 5.3029537, 7.5436664),
                            vec4(1.4593618, 8.91898, 3.5101583, 5.840625)) * buf5 +
                      vec4(2.2415268, -6.705987, -0.98861027, -2.117676);

            buf6 = sigmoid(buf6);
            buf7 = sigmoid(buf7);

            // Output Layer
            buf0 = mat4(vec4(1.6794263, 1.3817469, 2.9625452, 0.0),
                        vec4(-1.8834411, -1.4806935, -3.5924516, 0.0),
                        vec4(-1.3279216, -1.0918057, -2.3124623, 0.0),
                        vec4(0.2662234, 0.23235129, 0.44178495, 0.0)) * buf0 +
                      mat4(vec4(-0.6299101, -0.5945583, -0.9125601, 0.0),
                            vec4(0.17828953, 0.18300213, 0.18182953, 0.0),
                            vec4(-2.96544, -2.5819945, -4.9001055, 0.0),
                            vec4(1.4195864, 1.1868085, 2.5176322, 0.0)) * buf1 +
                      mat4(vec4(-1.2584374, -1.0552157, -2.1688404, 0.0),
                            vec4(-0.7200217, -0.52666044, -1.438251, 0.0),
                            vec4(0.15345335, 0.15196142, 0.272854, 0.0),
                            vec4(0.945728, 0.8861938, 1.2766753, 0.0)) * buf2 +
                      mat4(vec4(-2.4218085, -1.968602, -4.35166, 0.0),
                            vec4(-22.683098, -18.0544, -41.954372, 0.0),
                            vec4(0.63792, 0.5470648, 1.1078634, 0.0),
                            vec4(-1.5489894, -1.3075932, -2.6444845, 0.0)) * buf3 +
                      mat4(vec4(-0.49252132, -0.39877754, -0.91366625, 0.0),
                            vec4(0.95609266, 0.7923952, 1.640221, 0.0),
                            vec4(0.30616966, 0.15693925, 0.8639857, 0.0),
                            vec4(1.1825981, 0.94504964, 2.176963, 0.0)) * buf4 +
                      mat4(vec4(0.35446745, 0.3293795, 0.59547555, 0.0),
                            vec4(-0.58784515, -0.48177817, -1.0614829, 0.0),
                            vec4(2.5271258, 1.9991658, 4.6846647, 0.0),
                            vec4(0.13042648, 0.08864098, 0.30187556, 0.0)) * buf5 +
                      mat4(vec4(-1.7718065, -1.4033192, -3.3355875, 0.0),
                            vec4(3.1664357, 2.638297, 5.378702, 0.0),
                            vec4(-3.1724713, -2.6107926, -5.549295, 0.0),
                            vec4(-2.851368, -2.249092, -5.3013067, 0.0)) * buf6 +
                      mat4(vec4(1.5203838, 1.2212278, 2.8404984, 0.0),
                            vec4(1.5210563, 1.2651345, 2.683903, 0.0),
                            vec4(2.9789467, 2.4364579, 5.2347264, 0.0),
                            vec4(2.2270417, 1.8825914, 3.8028636, 0.0)) * buf7 +
                      vec4(-1.5468478, -3.6171484, 0.24762098, 0.0);

            buf0 = sigmoid(buf0);
            return vec4(buf0.x, buf0.y, buf0.z, 1.0);
        }

        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 uv = fragCoord / uResolution.xy * 2.0 - 1.0;
            uv.y *= -1.0; // Flip Y
            uv += 0.1 * vec2(sin(uv.y * 6.283 + uTime * 0.5), cos(uv.x * 6.283 + uTime * 0.5)) * 0.05; // Warp effect
            fragColor = cppn_fn(uv, 0.1 * sin(0.3 * uTime), 0.1 * sin(0.69 * uTime), 0.1 * sin(0.44 * uTime));
        }

        void main() {
            vec4 col;
            mainImage(col, gl_FragCoord.xy);
            col.rgb = hueShiftRGB(col.rgb, 0.0); // Hue shift is a parameter in the original, set to 0 here
            float scanline_val = sin(gl_FragCoord.y * 5.0) * 0.5 + 0.5; // Scanline freq is a parameter, set to 5.0 here
            col.rgb *= 1.0 - (scanline_val * scanline_val) * 0.2; // Scan intensity is a parameter, set to 0.2 here
            col.rgb += (rand(gl_FragCoord.xy + uTime) - 0.5) * 0.05; // Noise intensity is a parameter, set to 0.05 here
            gl_FragColor = vec4(clamp(col.rgb, 0.0, 1.0), 1.0);
        }
    `;

    // Compile shader
    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    // Link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
    }
    gl.useProgram(program);

    // Set up geometry (full-screen triangle)
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const resolutionUniformLocation = gl.getUniformLocation(program, "uResolution");
    const timeUniformLocation = gl.getUniformLocation(program, "uTime");

    // Set initial resolution
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize(); // Initial call

    // Render loop
    let startTime = performance.now();
    function render() {
        const currentTime = (performance.now() - startTime) / 1000;
        gl.uniform1f(timeUniformLocation, currentTime);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        requestAnimationFrame(render);
    }
    render();

})(); // IIFE to encapsulate background logic

// --- AOS Library Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 1000, // Default duration for animations
        once: true,      // Whether animation should happen only once - while scrolling down
        easing: 'ease-in-out', // Default easing for AOS animations
        offset: 100, // Offset (in px) from the original trigger point
    });
});

// --- Original Portfolio Scripts ---
// Navbar scroll effect and mobile menu
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Update active navigation link based on scroll position
    updateActiveNavLink();
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    const menuIcon = mobileMenuBtn.querySelector('i');

    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        
        // Toggle menu icon
        if (navLinks.classList.contains('active')) {
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-times');
        } else {
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navLinks.classList.remove('active');
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        }
    });
});

// Update active navigation link based on scroll position
function updateActiveNavLink() {
    const sections = ['projects', 'about', 'contact'];
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                currentSection = sectionId;
            }
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// The original Intersection Observer is replaced by AOS
/*
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card, .about-content, .contact').forEach(el => {
    observer.observe(el);
});
*/

// --- GitHub Repository Integration ---
class GitHubRepoManager {
    constructor() {
        this.username = 'darko-mode';
        this.apiUrl = `https://api.github.com/users/${this.username}/repos`;
        this.projectsGrid = document.getElementById('projects-grid');
        this.loadingState = document.getElementById('loading-state');
        this.errorState = document.getElementById('error-state');
        this.fallbackProjects = document.querySelectorAll('.fallback-project');
    }

    async fetchRepositories() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const repos = await response.json();
            return this.filterAndSortRepos(repos);
        } catch (error) {
            console.error('Error fetching repositories:', error);
            throw error;
        }
    }

    filterAndSortRepos(repos) {
        return repos
            .filter(repo => !repo.fork && !repo.private) // Only show non-fork, public repos
            .sort((a, b) => {
                // Sort by stars, then by updated date
                if (b.stargazers_count !== a.stargazers_count) {
                    return b.stargazers_count - a.stargazers_count;
                }
                return new Date(b.updated_at) - new Date(a.updated_at);
            })
            .slice(0, 6); // Show top 6 repositories
    }

    getLanguageColor(language) {
        const colors = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#2b7489',
            'Python': '#3572A5',
            'Java': '#b07219',
            'C++': '#f34b7d',
            'C': '#555555',
            'HTML': '#e34c26',
            'CSS': '#1572B6',
            'Vue': '#2c3e50',
            'React': '#61dafb',
            'PHP': '#4F5D95',
            'Ruby': '#701516',
            'Go': '#00ADD8',
            'Rust': '#dea584',
            'Swift': '#ffac45',
            'Kotlin': '#F18E33'
        };
        return colors[language] || '#6f42c1';
    }

    createProjectCard(repo, index) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-duration', '1000');
        card.setAttribute('data-aos-delay', (200 + index * 200).toString());

        // Generate placeholder image or use repo image if available
        const imageSection = repo.has_pages || repo.homepage ? 
            `<img src="https://opengraph.githubassets.com/1/${this.username}/${repo.name}" alt="${repo.name}" class="project-img" onerror="this.parentNode.innerHTML='<div class=\\"github-placeholder\\"><i class=\\"fab fa-github\\"></i></div>'">` :
            `<div class="github-placeholder"><i class="fab fa-github"></i></div>`;

        // Create topics HTML
        const topicsHtml = repo.topics && repo.topics.length > 0 ? 
            `<div class="repo-topics">
                ${repo.topics.slice(0, 3).map(topic => `<span class="repo-topic">${topic}</span>`).join('')}
            </div>` : '';

        // Create links
        const linksHtml = `
            <div class="repo-links">
                <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-link">
                    <i class="fab fa-github"></i> View Code
                </a>
                ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="repo-link demo-link">
                    <i class="fas fa-external-link-alt"></i> Live Demo
                </a>` : ''}
                ${repo.has_pages ? `<a href="https://${this.username}.github.io/${repo.name}" target="_blank" rel="noopener noreferrer" class="repo-link demo-link">
                    <i class="fas fa-external-link-alt"></i> GitHub Pages
                </a>` : ''}
            </div>
        `;

        card.innerHTML = `
            ${imageSection}
            <div class="project-overlay">
                <h3>${repo.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                ${repo.description ? `<p class="repo-description">${repo.description}</p>` : ''}
                ${repo.language ? `<div class="repo-language" style="background-color: ${this.getLanguageColor(repo.language)}20; color: ${this.getLanguageColor(repo.language)}">${repo.language}</div>` : ''}
                ${topicsHtml}
                <div class="repo-stats">
                    <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                    <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                    <span><i class="fas fa-eye"></i> ${repo.watchers_count}</span>
                </div>
                ${linksHtml}
            </div>
        `;

        return card;
    }

    showFallbackProjects() {
        this.fallbackProjects.forEach(project => {
            project.style.display = 'block';
        });
    }

    hideLoadingState() {
        if (this.loadingState) {
            this.loadingState.style.display = 'none';
        }
    }

    showErrorState() {
        if (this.errorState) {
            this.errorState.style.display = 'block';
        }
    }

    async init() {
        try {
            const repos = await this.fetchRepositories();
            this.hideLoadingState();

            if (repos.length === 0) {
                this.showErrorState();
                this.showFallbackProjects();
                return;
            }

            // Clear existing content and add new repo cards
            repos.forEach((repo, index) => {
                const card = this.createProjectCard(repo, index);
                this.projectsGrid.appendChild(card);
            });

            // Re-initialize AOS for new elements
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }

        } catch (error) {
            console.error('Failed to load GitHub repositories:', error);
            this.hideLoadingState();
            this.showErrorState();
            this.showFallbackProjects();
        }
    }
}

// Initialize GitHub repository manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize GitHub repositories
    const githubRepoManager = new GitHubRepoManager();
    githubRepoManager.init();
});