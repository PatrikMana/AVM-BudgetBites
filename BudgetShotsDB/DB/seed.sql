-- ============================================================================
-- BudgetShots Seed Data
-- Initial data for product types and aliases
-- ============================================================================

-- ============================================================================
-- PRODUCT TYPES - Alcohol categories
-- ============================================================================
INSERT INTO product_types (slug, name, is_alcoholic, parent_slug) VALUES
-- Spirits
('vodka', 'Vodka', TRUE, NULL),
('gin', 'Gin', TRUE, NULL),
('rum', 'Rum', TRUE, NULL),
('white_rum', 'Bílý rum', TRUE, 'rum'),
('dark_rum', 'Tmavý rum', TRUE, 'rum'),
('golden_rum', 'Zlatý rum', TRUE, 'rum'),
('tequila', 'Tequila', TRUE, NULL),
('mezcal', 'Mezcal', TRUE, 'tequila'),
('whisky', 'Whisky', TRUE, NULL),
('bourbon', 'Bourbon', TRUE, 'whisky'),
('scotch', 'Scotch', TRUE, 'whisky'),
('irish_whiskey', 'Irská whisky', TRUE, 'whisky'),
('brandy', 'Brandy', TRUE, NULL),
('cognac', 'Cognac', TRUE, 'brandy'),

-- Liqueurs
('liqueur', 'Likér', TRUE, NULL),
('triple_sec', 'Triple Sec', TRUE, 'liqueur'),
('orange_liqueur', 'Pomerančový likér', TRUE, 'liqueur'),
('coffee_liqueur', 'Kávový likér', TRUE, 'liqueur'),
('cream_liqueur', 'Smetanový likér', TRUE, 'liqueur'),
('herbal_liqueur', 'Bylinný likér', TRUE, 'liqueur'),
('fruit_liqueur', 'Ovocný likér', TRUE, 'liqueur'),
('amaretto', 'Amaretto', TRUE, 'liqueur'),

-- Aperitifs and bitters
('aperitif', 'Aperitiv', TRUE, NULL),
('vermouth', 'Vermouth', TRUE, 'aperitif'),
('campari', 'Campari', TRUE, 'aperitif'),
('bitters', 'Bitter', TRUE, NULL),

-- Beer
('beer', 'Pivo', TRUE, NULL),
('lager', 'Ležák', TRUE, 'beer'),
('pilsner', 'Plzeňské pivo', TRUE, 'beer'),
('ale', 'Ale', TRUE, 'beer'),
('wheat_beer', 'Pšeničné pivo', TRUE, 'beer'),
('radler', 'Radler', TRUE, 'beer'),
('non_alcoholic_beer', 'Nealkoholické pivo', FALSE, 'beer'),

-- Wine
('wine', 'Víno', TRUE, NULL),
('red_wine', 'Červené víno', TRUE, 'wine'),
('white_wine', 'Bílé víno', TRUE, 'wine'),
('rose_wine', 'Růžové víno', TRUE, 'wine'),
('sparkling_wine', 'Šumivé víno', TRUE, 'wine'),
('champagne', 'Šampaňské', TRUE, 'sparkling_wine'),
('prosecco', 'Prosecco', TRUE, 'sparkling_wine'),

-- Cider and others
('cider', 'Cider', TRUE, NULL),
('mead', 'Medovina', TRUE, NULL),
('absinthe', 'Absinth', TRUE, NULL),
('soju', 'Soju', TRUE, NULL),
('sake', 'Sake', TRUE, NULL),

-- Non-alcoholic
('mixer', 'Mixer', FALSE, NULL),
('tonic', 'Tonic', FALSE, 'mixer'),
('soda', 'Soda', FALSE, 'mixer'),
('juice', 'Džus', FALSE, 'mixer')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PRODUCT ALIASES - Pattern matching for classification
-- ============================================================================

-- VODKA
INSERT INTO product_aliases (match_value, match_type, product_type_id, brand, priority) VALUES
('vodka', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), NULL, 100),
('finlandia', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), 'Finlandia', 150),
('absolut', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), 'Absolut', 150),
('smirnoff', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), 'Smirnoff', 150),
('stolichnaya', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), 'Stolichnaya', 150),
('grey goose', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), 'Grey Goose', 150),
('belvedere', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), 'Belvedere', 150),
('russian standard', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), 'Russian Standard', 150),
('božkov vodka', 'contains', (SELECT id FROM product_types WHERE slug = 'vodka'), 'Božkov', 150),

-- GIN
('gin', 'contains', (SELECT id FROM product_types WHERE slug = 'gin'), NULL, 100),
('beefeater', 'contains', (SELECT id FROM product_types WHERE slug = 'gin'), 'Beefeater', 150),
('bombay', 'contains', (SELECT id FROM product_types WHERE slug = 'gin'), 'Bombay', 150),
('tanqueray', 'contains', (SELECT id FROM product_types WHERE slug = 'gin'), 'Tanqueray', 150),
('hendricks', 'contains', (SELECT id FROM product_types WHERE slug = 'gin'), 'Hendricks', 150),
('gordon', 'contains', (SELECT id FROM product_types WHERE slug = 'gin'), 'Gordon', 140),

-- RUM (generic and specific types)
('rum', 'contains', (SELECT id FROM product_types WHERE slug = 'rum'), NULL, 90),
('bacardi', 'contains', (SELECT id FROM product_types WHERE slug = 'white_rum'), 'Bacardi', 150),
('bacardi carta blanca', 'contains', (SELECT id FROM product_types WHERE slug = 'white_rum'), 'Bacardi', 160),
('bacardi carta negra', 'contains', (SELECT id FROM product_types WHERE slug = 'dark_rum'), 'Bacardi', 160),
('bacardi oro', 'contains', (SELECT id FROM product_types WHERE slug = 'golden_rum'), 'Bacardi', 160),
('havana club', 'contains', (SELECT id FROM product_types WHERE slug = 'rum'), 'Havana Club', 150),
('captain morgan', 'contains', (SELECT id FROM product_types WHERE slug = 'rum'), 'Captain Morgan', 150),
('malibu', 'contains', (SELECT id FROM product_types WHERE slug = 'rum'), 'Malibu', 150),
('kraken', 'contains', (SELECT id FROM product_types WHERE slug = 'dark_rum'), 'Kraken', 150),
('diplomatico', 'contains', (SELECT id FROM product_types WHERE slug = 'dark_rum'), 'Diplomatico', 150),
('bílý rum', 'contains', (SELECT id FROM product_types WHERE slug = 'white_rum'), NULL, 120),
('white rum', 'contains', (SELECT id FROM product_types WHERE slug = 'white_rum'), NULL, 120),
('tmavý rum', 'contains', (SELECT id FROM product_types WHERE slug = 'dark_rum'), NULL, 120),
('dark rum', 'contains', (SELECT id FROM product_types WHERE slug = 'dark_rum'), NULL, 120),
('zlatý rum', 'contains', (SELECT id FROM product_types WHERE slug = 'golden_rum'), NULL, 120),
('gold rum', 'contains', (SELECT id FROM product_types WHERE slug = 'golden_rum'), NULL, 120),

-- TEQUILA
('tequila', 'contains', (SELECT id FROM product_types WHERE slug = 'tequila'), NULL, 100),
('jose cuervo', 'contains', (SELECT id FROM product_types WHERE slug = 'tequila'), 'Jose Cuervo', 150),
('sierra', 'contains', (SELECT id FROM product_types WHERE slug = 'tequila'), 'Sierra', 140),
('patron', 'contains', (SELECT id FROM product_types WHERE slug = 'tequila'), 'Patron', 150),
('olmeca', 'contains', (SELECT id FROM product_types WHERE slug = 'tequila'), 'Olmeca', 150),
('mezcal', 'contains', (SELECT id FROM product_types WHERE slug = 'mezcal'), NULL, 100),

-- WHISKY
('whisky', 'contains', (SELECT id FROM product_types WHERE slug = 'whisky'), NULL, 100),
('whiskey', 'contains', (SELECT id FROM product_types WHERE slug = 'whisky'), NULL, 100),
('jack daniel', 'contains', (SELECT id FROM product_types WHERE slug = 'bourbon'), 'Jack Daniels', 150),
('jim beam', 'contains', (SELECT id FROM product_types WHERE slug = 'bourbon'), 'Jim Beam', 150),
('makers mark', 'contains', (SELECT id FROM product_types WHERE slug = 'bourbon'), 'Makers Mark', 150),
('johnnie walker', 'contains', (SELECT id FROM product_types WHERE slug = 'scotch'), 'Johnnie Walker', 150),
('ballantine', 'contains', (SELECT id FROM product_types WHERE slug = 'scotch'), 'Ballantine', 150),
('chivas', 'contains', (SELECT id FROM product_types WHERE slug = 'scotch'), 'Chivas Regal', 150),
('jameson', 'contains', (SELECT id FROM product_types WHERE slug = 'irish_whiskey'), 'Jameson', 150),
('tullamore', 'contains', (SELECT id FROM product_types WHERE slug = 'irish_whiskey'), 'Tullamore Dew', 150),
('bourbon', 'contains', (SELECT id FROM product_types WHERE slug = 'bourbon'), NULL, 120),
('scotch', 'contains', (SELECT id FROM product_types WHERE slug = 'scotch'), NULL, 120),

-- LIQUEURS
('likér', 'contains', (SELECT id FROM product_types WHERE slug = 'liqueur'), NULL, 90),
('liqueur', 'contains', (SELECT id FROM product_types WHERE slug = 'liqueur'), NULL, 90),
('jagermeister', 'contains', (SELECT id FROM product_types WHERE slug = 'herbal_liqueur'), 'Jagermeister', 150),
('jägermeister', 'contains', (SELECT id FROM product_types WHERE slug = 'herbal_liqueur'), 'Jagermeister', 150),
('becherovka', 'contains', (SELECT id FROM product_types WHERE slug = 'herbal_liqueur'), 'Becherovka', 150),
('fernet', 'contains', (SELECT id FROM product_types WHERE slug = 'herbal_liqueur'), 'Fernet', 150),
('unicum', 'contains', (SELECT id FROM product_types WHERE slug = 'herbal_liqueur'), 'Unicum', 150),
('triple sec', 'contains', (SELECT id FROM product_types WHERE slug = 'triple_sec'), NULL, 100),
('cointreau', 'contains', (SELECT id FROM product_types WHERE slug = 'triple_sec'), 'Cointreau', 150),
('grand marnier', 'contains', (SELECT id FROM product_types WHERE slug = 'orange_liqueur'), 'Grand Marnier', 150),
('kahlua', 'contains', (SELECT id FROM product_types WHERE slug = 'coffee_liqueur'), 'Kahlua', 150),
('baileys', 'contains', (SELECT id FROM product_types WHERE slug = 'cream_liqueur'), 'Baileys', 150),
('amaretto', 'contains', (SELECT id FROM product_types WHERE slug = 'amaretto'), NULL, 100),
('disaronno', 'contains', (SELECT id FROM product_types WHERE slug = 'amaretto'), 'Disaronno', 150),

-- APERITIFS
('aperol', 'contains', (SELECT id FROM product_types WHERE slug = 'aperitif'), 'Aperol', 150),
('campari', 'contains', (SELECT id FROM product_types WHERE slug = 'campari'), 'Campari', 150),
('martini', 'contains', (SELECT id FROM product_types WHERE slug = 'vermouth'), 'Martini', 150),
('vermouth', 'contains', (SELECT id FROM product_types WHERE slug = 'vermouth'), NULL, 100),
('cinzano', 'contains', (SELECT id FROM product_types WHERE slug = 'vermouth'), 'Cinzano', 150),

-- BEER
('pivo', 'contains', (SELECT id FROM product_types WHERE slug = 'beer'), NULL, 90),
('beer', 'contains', (SELECT id FROM product_types WHERE slug = 'beer'), NULL, 90),
('pilsner urquell', 'contains', (SELECT id FROM product_types WHERE slug = 'pilsner'), 'Pilsner Urquell', 150),
('plzeň', 'contains', (SELECT id FROM product_types WHERE slug = 'pilsner'), NULL, 140),
('budweiser', 'contains', (SELECT id FROM product_types WHERE slug = 'lager'), 'Budweiser', 150),
('budvar', 'contains', (SELECT id FROM product_types WHERE slug = 'lager'), 'Budvar', 150),
('staropramen', 'contains', (SELECT id FROM product_types WHERE slug = 'lager'), 'Staropramen', 150),
('kozel', 'contains', (SELECT id FROM product_types WHERE slug = 'lager'), 'Kozel', 150),
('gambrinus', 'contains', (SELECT id FROM product_types WHERE slug = 'lager'), 'Gambrinus', 150),
('heineken', 'contains', (SELECT id FROM product_types WHERE slug = 'lager'), 'Heineken', 150),
('corona', 'contains', (SELECT id FROM product_types WHERE slug = 'lager'), 'Corona', 150),
('radler', 'contains', (SELECT id FROM product_types WHERE slug = 'radler'), NULL, 120),
('nealko', 'contains', (SELECT id FROM product_types WHERE slug = 'non_alcoholic_beer'), NULL, 130),
('nealkoholické', 'contains', (SELECT id FROM product_types WHERE slug = 'non_alcoholic_beer'), NULL, 130),
('birell', 'contains', (SELECT id FROM product_types WHERE slug = 'non_alcoholic_beer'), 'Birell', 150),

-- WINE
('víno', 'contains', (SELECT id FROM product_types WHERE slug = 'wine'), NULL, 90),
('wine', 'contains', (SELECT id FROM product_types WHERE slug = 'wine'), NULL, 90),
('červené víno', 'contains', (SELECT id FROM product_types WHERE slug = 'red_wine'), NULL, 120),
('bílé víno', 'contains', (SELECT id FROM product_types WHERE slug = 'white_wine'), NULL, 120),
('růžové víno', 'contains', (SELECT id FROM product_types WHERE slug = 'rose_wine'), NULL, 120),
('rosé', 'contains', (SELECT id FROM product_types WHERE slug = 'rose_wine'), NULL, 120),
('sekt', 'contains', (SELECT id FROM product_types WHERE slug = 'sparkling_wine'), NULL, 120),
('šumivé', 'contains', (SELECT id FROM product_types WHERE slug = 'sparkling_wine'), NULL, 120),
('prosecco', 'contains', (SELECT id FROM product_types WHERE slug = 'prosecco'), NULL, 130),
('champagne', 'contains', (SELECT id FROM product_types WHERE slug = 'champagne'), NULL, 130),
('šampaňské', 'contains', (SELECT id FROM product_types WHERE slug = 'champagne'), NULL, 130),
('moet', 'contains', (SELECT id FROM product_types WHERE slug = 'champagne'), 'Moet', 150),

-- OTHERS
('cider', 'contains', (SELECT id FROM product_types WHERE slug = 'cider'), NULL, 100),
('medovina', 'contains', (SELECT id FROM product_types WHERE slug = 'mead'), NULL, 100),
('absinth', 'contains', (SELECT id FROM product_types WHERE slug = 'absinthe'), NULL, 100),
('brandy', 'contains', (SELECT id FROM product_types WHERE slug = 'brandy'), NULL, 100),
('cognac', 'contains', (SELECT id FROM product_types WHERE slug = 'cognac'), NULL, 100),
('koňak', 'contains', (SELECT id FROM product_types WHERE slug = 'cognac'), NULL, 100),
('hennessy', 'contains', (SELECT id FROM product_types WHERE slug = 'cognac'), 'Hennessy', 150),
('rémy martin', 'contains', (SELECT id FROM product_types WHERE slug = 'cognac'), 'Remy Martin', 150)
ON CONFLICT DO NOTHING;
