/**
 * Animations - Scroll-triggered animations and interactions
 */

document.addEventListener('DOMContentLoaded', function() {

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.fade-in, .slide-up, .slide-down').forEach(element => {
        // Set initial state
        element.style.opacity = '0';

        if (element.classList.contains('slide-up')) {
            element.style.transform = 'translateY(30px)';
        } else if (element.classList.contains('slide-down')) {
            element.style.transform = 'translateY(-30px)';
        }

        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';

        observer.observe(element);
    });

    // Counter animation for stats
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // Observe stat values for counter animation
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const text = element.textContent.trim();
                const number = parseInt(text.replace(/\D/g, ''));

                if (!isNaN(number)) {
                    element.textContent = '0';
                    animateCounter(element, number);
                }

                statsObserver.unobserve(element);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-value').forEach(stat => {
        statsObserver.observe(stat);
    });

    // Parallax effect for hero section
    const hero = document.getElementById('hero');
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const parallaxSpeed = 0.5;
            hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        });
    }

    // Card hover effects with tilt (optional enhancement)
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });

    // Loading animation for images
    document.querySelectorAll('img').forEach(img => {
        if (!img.complete) {
            img.style.opacity = '0';
            img.addEventListener('load', function() {
                this.style.transition = 'opacity 0.3s ease';
                this.style.opacity = '1';
            });
        }
    });

    // Matrix cells animation (if present)
    const matrixCells = document.querySelectorAll('.matrix-cell');
    if (matrixCells.length > 0) {
        matrixCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.opacity = '0';
                cell.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    cell.style.opacity = '1';
                }, index * 5);
            }, 100);
        });
    }

    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add CSS for ripple animation
    if (!document.getElementById('ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
});
