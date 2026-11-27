export interface HeroStat {
  value: string;
  label: string;
}

export interface FloatingCard {
  label: string;
  title: string;
}

export interface HeroBanner {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;

  shopButtonText: string;
  shopButtonLink: string;

  exploreButtonText: string;
  exploreButtonLink: string;
  exploreFragment: string;

  stats: HeroStat[];

  floatingCard: FloatingCard;
}