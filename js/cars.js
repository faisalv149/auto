/*
 * Ascend Auto: showroom data
 * ---------------------------------------------------------------
 * PLACEHOLDER: all six showroom slots currently reuse the 2014 Acura TL.
 * When the real cut-outs are ready, replace each slot below with its own
 * car (copy the ACURA_TL shape). Everything on the page is generated from
 * this file: ring, ticks, popup pins, spec panel and saved-cars list.
 *
 * Image rules for every car:
 *  - transparent background (WebP or PNG with alpha)
 *  - same 3/4 front angle as the Acura (car facing left)
 *  - cropped tight, tyres touching the bottom edge
 *  - `src` about 800px wide, `large` the full-size original
 *  - `w`/`h` = natural size of `large` (sets the aspect ratio)
 *
 * Pins: x / y are percentages of the image box; they are numbered in the
 * order the pinned specs appear, and link to the matching spec row.
 */
(function () {
  const DEALER = {
    name: 'Ascend Auto',
    phone: '(512) 598-5605',
    tel: '+15125985605',
    address: '16400 S IH 35 Frontage Rd., Buda, TX 78610',
    site: 'https://www.ascendautos.com',
    inventoryUrl: 'https://www.ascendautos.com/cars-for-sale',
    inStock: 28,
    timeZone: 'America/Chicago',
    // minutes after midnight [open, close]; null = closed
    hours: { 0: null, 1: [630, 1080], 2: [630, 1080], 3: [630, 1080], 4: [630, 1080], 5: [630, 1080], 6: [630, 900] }
  };

  const ACURA_TL = {
    id: 'acura-tl-2014-2102',
    name: '2014 Acura TL',
    body: '4dr Sedan',
    price: 10550,
    mileage: 120105,
    stock: '2102',
    vin: '19UUA8F20EA009161',
    note: 'ONE OWNER AND TIMING BELT DONE 120K',   // the listing's own description, verbatim
    url: 'https://www.ascendautos.com/details/used-2014-acura-tl/128854926',
    gallery: { dir: 'assets/cars/gallery/acura-tl-2014', count: 11 },   // listing photos (tools/fetch-gallery.py)
    image: {
      src: 'assets/cars/acura-tl-2014-800.webp',
      large: 'assets/cars/acura-tl-2014.webp',
      w: 1705,
      h: 707
    },
    specs: [
      // labels, values and order exactly as on the ascendautos.com listing
      { key: 'engine', label: 'Engine', value: '3.5L V6 280hp 254ft. lbs.', pin: { x: 17.5, y: 41 } },
      { key: 'transmission', label: 'Transmission', value: 'Automatic 6-Speed' },
      { key: 'drivetrain', label: 'Drivetrain', value: 'FWD', pin: { x: 44, y: 75 } },
      { key: 'exterior', label: 'Exterior Color', value: 'White', pin: { x: 62.5, y: 55 } },
      { key: 'interior', label: 'Interior Color', value: 'N/A' },
      { key: 'fuel', label: 'Fuel Economy', value: '20 city / 29 hwy', pin: { x: 88, y: 30 } }
    ]
  };

  const AUDI_Q3 = {
    id: 'audi-q3-2018-2088',
    name: '2018 Audi Q3',
    body: 'Premium',
    price: 9950,
    mileage: 105793,
    stock: '2088',
    vin: 'WA1BCCFS4JR026117',
    note: '',
    url: 'https://www.ascendautos.com/details/used-2018-audi-q3/130594345',
    gallery: { dir: 'assets/cars/gallery/audi-q3-2018', count: 12 },
    image: {
      src: 'assets/cars/audi-q3-2018-800.webp',
      large: 'assets/cars/audi-q3-2018.webp',
      w: 1669,
      h: 714
    },
    specs: [
      { key: 'engine', label: 'Engine', value: '2.0L Turbo I4 200hp 207ft. lbs.', pin: { x: 19, y: 41 } },
      { key: 'transmission', label: 'Transmission', value: 'Automatic 6-Speed' },
      { key: 'drivetrain', label: 'Drivetrain', value: 'FWD', pin: { x: 39, y: 76 } },
      { key: 'exterior', label: 'Exterior Color', value: 'White', pin: { x: 60, y: 58 } },
      { key: 'interior', label: 'Interior Color', value: 'N/A' },
      { key: 'fuel', label: 'Fuel Economy', value: 'N/A' }
    ]
  };

  const FORD_MUSTANG = {
    id: 'ford-mustang-2011-2110',
    name: '2011 Ford Mustang V6 Premium',
    body: 'V6 Premium 2dr Fastback',
    price: 10999,
    mileage: 79310,
    stock: '2110',
    vin: '1ZVBP8AM8B5141695',
    note: '',
    url: 'https://www.ascendautos.com/details/used-2011-ford-mustang/129907494',
    gallery: { dir: 'assets/cars/gallery/ford-mustang-2011', count: 11 },
    image: {
      src: 'assets/cars/ford-mustang-2011-800.webp',
      large: 'assets/cars/ford-mustang-2011.webp',
      w: 1787,
      h: 680
    },
    specs: [
      { key: 'engine', label: 'Engine', value: '3.7L V6 305hp 280ft. lbs.', pin: { x: 16, y: 35 } },
      { key: 'transmission', label: 'Transmission', value: 'Automatic 6-Speed' },
      { key: 'drivetrain', label: 'Drivetrain', value: 'RWD', pin: { x: 90.5, y: 71 } },
      { key: 'exterior', label: 'Exterior Color', value: 'Blue', pin: { x: 67.5, y: 54 } },
      { key: 'interior', label: 'Interior Color', value: 'N/A' },
      { key: 'fuel', label: 'Fuel Economy', value: '19 city / 31 hwy' }
    ]
  };

  const FORD_F150 = {
    id: 'ford-f150-2014-2157',
    name: '2014 Ford F-150 STX',
    body: '4x2 STX 2dr Regular Cab Styleside 6.5 ft. SB',
    price: 10450,
    mileage: 132694,
    stock: '2157',
    vin: '1FTMF1CM7EFA55912',
    note: '',
    url: 'https://www.ascendautos.com/details/used-2014-ford-f-150/133647478',
    gallery: { dir: 'assets/cars/gallery/ford-f150-2014', count: 10 },
    image: {
      src: 'assets/cars/ford-f150-2014-800.webp',
      large: 'assets/cars/ford-f150-2014.webp',
      w: 1646,
      h: 728
    },
    specs: [
      { key: 'engine', label: 'Engine', value: '3.7L Flex Fuel V6 302hp 278ft. lbs.', pin: { x: 14, y: 31 } },
      { key: 'transmission', label: 'Transmission', value: 'Automatic 6-Speed' },
      { key: 'drivetrain', label: 'Drivetrain', value: '4X2', pin: { x: 87.5, y: 71 } },
      { key: 'exterior', label: 'Exterior Color', value: 'Black', pin: { x: 60, y: 57 } },
      { key: 'interior', label: 'Interior Color', value: 'N/A' },
      { key: 'fuel', label: 'Fuel Economy', value: '17 city / 23 hwy', pin: { x: 82, y: 40 } }
    ]
  };

  const NISSAN_ALTIMA = {
    id: 'nissan-altima-2008-2149',
    name: '2008 Nissan Altima 2.5 S',
    body: '2.5 S 2dr Coupe CVT',
    price: 5999,
    mileage: 122463,
    stock: '2149',
    vin: '1N4AL24E38C282258',
    note: '',
    url: 'https://www.ascendautos.com/details/used-2008-nissan-altima/133355834',
    gallery: { dir: 'assets/cars/gallery/nissan-altima-2008', count: 12 },
    image: {
      src: 'assets/cars/nissan-altima-2008-800.webp',
      large: 'assets/cars/nissan-altima-2008.webp',
      w: 1784,
      h: 714
    },
    specs: [
      { key: 'engine', label: 'Engine', value: '2.5L I4 175hp 180ft. lbs.', pin: { x: 16, y: 37 } },
      { key: 'transmission', label: 'Transmission', value: 'CVT' },
      { key: 'drivetrain', label: 'Drivetrain', value: 'FWD', pin: { x: 44.5, y: 76 } },
      { key: 'exterior', label: 'Exterior Color', value: 'Gray', pin: { x: 62.5, y: 55 } },
      { key: 'interior', label: 'Interior Color', value: 'N/A' },
      { key: 'fuel', label: 'Fuel Economy', value: '23 city / 31 hwy', pin: { x: 94, y: 36 } }
    ]
  };

  // Six showroom slots, in order. Real cars first; the rest still reuse the
  // Acura as a placeholder until their cut-outs arrive.
  const placeholder = (slot) => ({ ...ACURA_TL, id: ACURA_TL.id + '-slot' + slot, placeholder: true });
  const cars = [
    ACURA_TL,
    AUDI_Q3,
    FORD_MUSTANG,
    FORD_F150,
    NISSAN_ALTIMA,
    placeholder(6)
  ];

  window.ASCEND = { dealer: DEALER, cars };
})();
