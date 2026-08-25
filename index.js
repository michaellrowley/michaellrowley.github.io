const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setPointerPosition = (event) => {
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
    card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
};

document.querySelectorAll('.project-card, .disclosure-card').forEach((card) => {
    card.addEventListener('pointermove', setPointerPosition);
});

document.querySelectorAll('[data-nda]').forEach((card) => {
    card.addEventListener('click', () => {
        window.alert('This vulnerability was acknowledged, triaged, and patched by the vendor.\n\nDetails cannot be shared publicly due to clauses either in Rules of Engagement or Non-Disclosure Agreement(s).');
    });
});

const filterButtons = document.querySelectorAll('[data-filter]');
const projectGroups = document.querySelectorAll('.project-group');

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
        projectGroups.forEach((group) => {
            const matches = filter === 'all' || group.dataset.category.split(' ').includes(filter);
            group.classList.toggle('is-hidden', !matches);
            if (matches && !reducedMotion) {
                group.classList.remove('is-visible');
                requestAnimationFrame(() => group.classList.add('is-visible'));
            }
        });
    });
});

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
    revealItems.forEach((item) => revealObserver.observe(item));
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
