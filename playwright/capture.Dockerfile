# The environment the manual's captures are produced in - locally and in CI.
#
# Why a container at all: the app sets `--font-family: system-ui` (app.css) and
# ships no webfont, so every glyph in every screenshot comes from the fonts of
# whatever machine runs the browser. A developer machine resolves system-ui to
# Noto Sans, a GitHub runner to something else entirely, and all 50 images of
# the manual differ - not subtly, the first CI run reported every single one.
# Chromium is already pinned by Playwright; this pins the other half.
#
# It is not only the font files. freetype and harfbuzz decide how a glyph is
# hinted and rasterised, and they differ between distributions just as much -
# which is why installing the same fonts on the runner would not have been
# enough.
#
# Build and use it through scripts/capture.sh, never directly.
ARG PLAYWRIGHT_VERSION=1.62.1
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

# The base image brings Liberation, FreeSans and a set of CJK fonts, and
# resolves system-ui to WenQuanYi Zen Hei - a Chinese font for a German
# interface. Noto Sans is added because that is what the published images of the
# manual already show; it keeps a regeneration from changing the typography of
# every chapter.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends fonts-noto-core \
	&& rm -rf /var/lib/apt/lists/*

# Installing the font is not enough - fontconfig still has to prefer it over
# what the base image brought.
COPY capture-fonts.conf /etc/fonts/local.conf

RUN fc-cache -f >/dev/null \
	&& fc-match system-ui | grep -q 'Noto Sans' \
	&& fc-match sans-serif | grep -q 'Noto Sans'

# The client alone, no daemon. tests/04-dashboard.spec.ts has to reach into the
# backend container: the dashboard statistics are cached for five minutes in a
# LocMemCache per gunicorn worker (DashboardStatisticsView), so seeded warranty
# deadlines and node dates only become visible once the workers have been
# HUPed. Without this the two seeding tests fail inside the container while
# every other spec passes.
#
# scripts/capture.sh mounts the host's docker socket for it.
ARG DOCKER_CLI_VERSION=27.5.1
RUN curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_CLI_VERSION}.tgz" \
	| tar -xz -C /usr/local/bin --strip-components=1 docker/docker \
	&& docker --version
