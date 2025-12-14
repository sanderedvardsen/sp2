interface HeroProps {
  onSignUpClick: () => void;
}

export function renderHero(props: HeroProps): HTMLElement {
  const hero = document.createElement('div');
  hero.className = 'hero';

  const container = document.createElement('div');
  container.className = 'hero-container';

  const title = document.createElement('h1');
  title.className = 'hero-title';
  title.textContent = 'Discover Unique Treasures';

  const description = document.createElement('p');
  description.className = 'hero-description';
  description.textContent = 'Bid on rare collectibles, fine art, luxury items, and more. Join thousands of collectors in the world\'s premier online auction house.';

  const cta = document.createElement('button');
  cta.className = 'hero-cta';
  cta.textContent = 'Get Started';
  cta.onclick = props.onSignUpClick;

  container.appendChild(title);
  container.appendChild(description);
  container.appendChild(cta);
  hero.appendChild(container);

  return hero;
}
