export class CategoriesViewManager {
  private static map = {
    'Home': 'assets/imgs/categories/civilization2.jpg',
    'Companies&amp;Markets': 'assets/imgs/categories/economics.jpg',
    'Energy': 'assets/imgs/categories/energy.jpg',
    'Entertainment': 'assets/imgs/categories/entertainment.jpg',
    'Featured': 'assets/imgs/categories/featured.png',
    'Health': 'assets/imgs/categories/health.jpg',
    'Life': 'assets/imgs/categories/life.jpg',
    'Metro': 'assets/imgs/categories/companies.jpg',
    'Money': 'assets/imgs/categories/money.jpg',
    'Science': 'assets/imgs/categories/science.jpg',
    'Business': 'assets/imgs/categories/newspaper.jpg',
    'WORLD': 'assets/imgs/categories/world3.jpg',
    'Technology': 'assets/imgs/categories/tech.jpg',
    'News': 'assets/imgs/categories/newspaper.jpg',
    'Travel': 'assets/imgs/categories/travel.jpg',
    'Politics': 'assets/imgs/categories/politics.jpg',
    'Search': 'assets/imgs/categories/search_results.jpg'
  };

  public static getCategoryDefaultImage(category: {}|string): string {
    return CategoriesViewManager.map[typeof category === 'string' ? category : category['name']];
  }
}
