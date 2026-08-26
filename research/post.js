(() => {
    const page = document.body;
    const sourcePath = page.dataset.postSource;
    if (!sourcePath) return;

    page.classList.add('post-page');

    const escapeHtml = (value) => value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const readMetadata = (source) => {
        const read = (name) => {
            const match = source.match(new RegExp(`^\\\\${name}\\\\{([^\\n]*)\\\\}$`, 'm'));
            return match ? match[1].trim() : '';
        };
        return {
            title: read('title') || document.title,
            description: read('description'),
            subtitle: read('subtitle')
        };
    };

    const readBrace = (value, start) => {
        if (value[start] !== '{') return { value: '', end: start };
        let depth = 0;
        for (let index = start; index < value.length; index += 1) {
            if (value[index] === '{' && value[index - 1] !== '\\') depth += 1;
            if (value[index] === '}' && value[index - 1] !== '\\') {
                depth -= 1;
                if (depth === 0) return { value: value.slice(start + 1, index), end: index + 1 };
            }
        }
        return { value: value.slice(start + 1), end: value.length };
    };

    const renderInline = (value) => {
        let output = '';
        let index = 0;
        while (index < value.length) {
            if (value[index] === '$') {
                let end = index + 1;
                while (end < value.length && (value[end] !== '$' || value[end - 1] === '\\')) end += 1;
                output += escapeHtml(value.slice(index, Math.min(end + 1, value.length)));
                index = Math.min(end + 1, value.length);
                continue;
            }
            if (value[index] !== '\\') {
                output += escapeHtml(value[index]);
                index += 1;
                continue;
            }

            if (value[index + 1] === '\\') {
                output += '<br>';
                index += 2;
                continue;
            }
            const symbol = value[index + 1];
            if ('&%#_{}$'.includes(symbol)) {
                output += escapeHtml(symbol);
                index += 2;
                continue;
            }
            const commandMatch = value.slice(index + 1).match(/^[A-Za-z]+/);
            if (!commandMatch) {
                output += escapeHtml('\\');
                index += 1;
                continue;
            }

            const command = commandMatch[0];
            index += command.length + 1;
            if (command === 'textbackslash') {
                if (value[index] === '{') index = readBrace(value, index).end;
                output += '\\\\';
                continue;
            }
            if (command === 'medskip') {
                output += '<div class="tex-space"></div>';
                continue;
            }
            if (!['href', 'emph', 'textit', 'textbf', 'texttt', 'sout'].includes(command)) {
                output += escapeHtml(`\\${command}`);
                continue;
            }

            const first = readBrace(value, index);
            if (command === 'href') {
                const second = readBrace(value, first.end);
                output += `<a href="${escapeHtml(first.value)}">${renderInline(second.value)}</a>`;
                index = second.end;
            } else {
                const tag = command === 'emph' ? 'em' : command === 'textit' ? 'i' : command === 'textbf' ? 'strong' : command === 'sout' ? 's' : 'code';
                output += `<${tag}>${renderInline(first.value)}</${tag}>`;
                index = first.end;
            }
        }
        return output;
    };

    const renderList = (lines, start, environment) => {
        const tag = environment === 'enumerate' ? 'ol' : 'ul';
        const items = [];
        let current = null;
        let index = start;
        while (index < lines.length) {
            const line = lines[index].trim();
            if (line === `\\end{${environment}}`) break;
            const nested = line.match(/^\\begin\{(itemize|enumerate)\}$/);
            if (nested && current) {
                const child = renderList(lines, index + 1, nested[1]);
                current.push(child.html);
                index = child.end + 1;
                continue;
            }
            if (line.startsWith('\\item ')) {
                current = [renderInline(line.slice(6))];
                items.push(current);
            } else if (current && line) {
                current.push(` ${renderInline(line)}`);
            }
            index += 1;
        }
        return { html: `<${tag}>${items.map((item) => `<li>${item.join('')}</li>`).join('')}</${tag}>`, end: index };
    };

    const renderTeX = (source) => {
        const lines = source.split(/\r?\n/);
        const output = [];
        let paragraph = [];
        const flushParagraph = () => {
            const content = paragraph.join(' ').trim();
            if (content) output.push(`<p>${renderInline(content)}</p>`);
            paragraph = [];
        };

        let index = 0;
        while (index < lines.length) {
            const line = lines[index];
            const trimmed = line.trim();
            if (!trimmed || /^\\(title|description|subtitle)\{/.test(trimmed)) {
                flushParagraph();
                index += 1;
                continue;
            }
            if (trimmed === '\\begin{rawhtml}') {
                flushParagraph();
                const raw = [];
                index += 1;
                while (index < lines.length && lines[index].trim() !== '\\end{rawhtml}') raw.push(lines[index++]);
                output.push(raw.join('\n'));
                index += 1;
                continue;
            }
            const headingMatch = trimmed.match(/^\\(section|subsection|subsubsection|paragraph)\{([\s\S]*)\}$/);
            if (headingMatch) {
                flushParagraph();
                const level = { section: 2, subsection: 3, subsubsection: 4, paragraph: 5 }[headingMatch[1]];
                output.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
                index += 1;
                continue;
            }
            const listMatch = trimmed.match(/^\\begin\{(itemize|enumerate)\}$/);
            if (listMatch) {
                flushParagraph();
                const list = renderList(lines, index + 1, listMatch[1]);
                output.push(list.html);
                index = list.end + 1;
                continue;
            }
            if (trimmed === '\\medskip') {
                flushParagraph();
                output.push('<div class="tex-space"></div>');
                index += 1;
                continue;
            }
            paragraph.push(trimmed);
            index += 1;
        }
        flushParagraph();
        return output.join('\n');
    };

    const slugify = (value, used) => {
        const base = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        let slug = base;
        let count = 2;
        while (used.has(slug)) slug = `${base}-${count++}`;
        used.add(slug);
        return slug;
    };

    const buildTableOfContents = (article, toc) => {
        const used = new Set();
        const headings = [...article.querySelectorAll('h2, h3')];
        headings.forEach((heading) => {
            heading.id = heading.id || slugify(heading.textContent, used);
            const item = document.createElement('a');
            item.href = `#${heading.id}`;
            item.className = `toc-${heading.tagName.toLowerCase()}`;
            item.textContent = heading.textContent;
            toc.append(item);
        });
        toc.hidden = headings.length === 0;
    };

    const createShell = (meta) => {
        const shell = document.createElement('div');
        shell.className = 'post-shell';
        shell.innerHTML = `
            <div class="post-progress-rail" id="post-progress" role="scrollbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
                <span class="post-progress-label">READING PROGRESS</span>
                <span class="post-progress-track"><span class="post-progress-thumb"></span></span>
                <span class="post-progress-value">0%</span>
            </div>
            <header class="post-hero">
                <a class="post-back" href="../../../index.html"><span>←</span> Back to work</a>
                <p class="post-kicker"><span></span>Research note / Michael Rowley</p>
                <h1>${escapeHtml(meta.title)}</h1>
                ${meta.subtitle || meta.description ? `<p class="post-subtitle">${escapeHtml(meta.subtitle || meta.description)}</p>` : ''}
                <div class="post-hero-meta"><span>Independent research</span><span class="post-reading-time"></span><span>↘ Scroll to explore</span></div>
            </header>
            <div class="post-layout">
                <aside class="post-toc" aria-label="On this page"></aside>
                <article class="post-content" id="post-content"></article>
            </div>
            <footer class="post-footer"><a href="../../../index.html">← Return to Michael Rowley</a><span>End of research note</span></footer>
        `;
        return shell;
    };

    const runScript = (oldScript) => new Promise((resolve) => {
        const anchor = document.createComment('post-script');
        oldScript.replaceWith(anchor);
        const script = document.createElement('script');
        [...oldScript.attributes].forEach((attribute) => script.setAttribute(attribute.name, attribute.value));
        script.textContent = oldScript.textContent;

        const isDocumentWritingEmbed = oldScript.src && /gist\.github\.com/.test(oldScript.src);
        let originalWrite;
        if (isDocumentWritingEmbed) {
            originalWrite = document.write;
            document.write = (markup) => anchor.insertAdjacentHTML('beforebegin', markup);
        }

        if (script.src) {
            script.onload = () => {
                if (originalWrite) document.write = originalWrite;
                resolve();
            };
            script.onerror = () => {
                if (originalWrite) document.write = originalWrite;
                resolve();
            };
        } else {
            script.onload = resolve;
        }

        anchor.parentNode.insertBefore(script, anchor);
        if (!script.src) {
            if (originalWrite) document.write = originalWrite;
            resolve();
        }
    });

    const runEmbeddedScripts = async (article) => {
        const scripts = [...article.querySelectorAll('script')];
        for (const script of scripts) await runScript(script);
    };

    const loadMathRenderer = () => new Promise((resolve) => {
        if (!page.dataset.postMath) return resolve();
        if (window.translate) {
            window.translate();
            return resolve();
        }
        const script = document.createElement('script');
        script.src = new URL('../../../LaTeXMathML.js', window.location.href).href;
        script.onload = () => {
            if (window.translate) window.translate();
            resolve();
        };
        script.onerror = resolve;
        document.head.append(script);
    });

    const updateProgress = () => {
        const rail = document.getElementById('post-progress');
        if (!rail) return;
        const range = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max(window.scrollY / range, 0), 1);
        rail.style.setProperty('--progress-position', `${progress * 100}%`);
        rail.setAttribute('aria-valuenow', Math.round(progress * 100));
        rail.querySelector('.post-progress-value').textContent = `${Math.round(progress * 100)}%`;
    };

    const installProgress = () => {
        const rail = document.getElementById('post-progress');
        if (!rail) return;
        let ticking = false;
        const requestProgress = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                updateProgress();
                ticking = false;
            });
        };
        window.addEventListener('scroll', requestProgress, { passive: true });
        window.addEventListener('resize', requestProgress);
        rail.addEventListener('pointerdown', (event) => {
            const bounds = rail.getBoundingClientRect();
            const fraction = window.innerWidth <= 700
                ? (event.clientX - bounds.left) / bounds.width
                : (event.clientY - bounds.top) / bounds.height;
            const range = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            window.scrollTo({ top: Math.min(Math.max(fraction, 0), 1) * range, behavior: 'smooth' });
        });
        rail.addEventListener('keydown', (event) => {
            const range = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            if (event.key === 'Home') window.scrollTo({ top: 0, behavior: 'smooth' });
            if (event.key === 'End') window.scrollTo({ top: range, behavior: 'smooth' });
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') window.scrollBy({ top: window.innerHeight * 0.1, behavior: 'smooth' });
            if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') window.scrollBy({ top: -window.innerHeight * 0.1, behavior: 'smooth' });
        });
        updateProgress();
    };

    const render = async () => {
        try {
            const response = await fetch(new URL(sourcePath, window.location.href));
            if (!response.ok) throw new Error(`Could not load ${sourcePath}`);
            const source = await response.text();
            const meta = readMetadata(source);
            const shell = createShell(meta);
            document.body.replaceChildren(shell);
            document.title = meta.title;

            const article = shell.querySelector('.post-content');
            article.innerHTML = renderTeX(source);
            const readingTime = Math.max(1, Math.round(article.textContent.trim().split(/\s+/).length / 220));
            shell.querySelector('.post-reading-time').textContent = `${readingTime} min read`;
            buildTableOfContents(article, shell.querySelector('.post-toc'));
            await runEmbeddedScripts(article);
            await loadMathRenderer();
            installProgress();
        } catch (error) {
            document.body.innerHTML = `<main class="post-error"><p class="post-kicker"><span></span>Research note</p><h1>Unable to load this post.</h1><p>${escapeHtml(error.message)}</p><a href="../../../index.html">Return home ↗</a></main>`;
            console.error(error);
        }
    };

    render();
})();
