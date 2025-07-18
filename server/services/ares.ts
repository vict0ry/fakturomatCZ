interface AresResponse {
  ekonomickySubjekt: {
    ico: string;
    obchodniJmeno: string;
    sidlo: {
      nazevObce: string;
      psc: string;
      nazevUlice?: string;
      cisloDomovni?: string;
      cisloOrientacni?: string;
    };
    dic?: string;
  };
}

export async function fetchCompanyFromAres(ico: string): Promise<{
  ico: string;
  name: string;
  dic?: string;
  address: string;
  city: string;
  postalCode: string;
} | null> {
  try {
    const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: AresResponse = await response.json();
    const subject = data.ekonomickySubjekt;

    let address = '';
    if (subject.sidlo.nazevUlice) {
      address += subject.sidlo.nazevUlice;
      if (subject.sidlo.cisloDomovni) {
        address += ` ${subject.sidlo.cisloDomovni}`;
      }
      if (subject.sidlo.cisloOrientacni) {
        address += `/${subject.sidlo.cisloOrientacni}`;
      }
    }

    return {
      ico: subject.ico,
      name: subject.obchodniJmeno,
      dic: subject.dic,
      address: address || '',
      city: subject.sidlo.nazevObce,
      postalCode: subject.sidlo.psc,
    };
  } catch (error) {
    console.error('ARES API error:', error);
    return null;
  }
}

export async function searchCompaniesByName(name: string): Promise<Array<{
  ico: string;
  name: string;
  address: string;
  city: string;
}>> {
  try {
    const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        obchodniJmeno: name,
        maxPocetVysledku: 10,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.ekonomickeSubjekty) {
      return [];
    }

    return data.ekonomickeSubjekty.map((subject: any) => {
      let address = '';
      if (subject.sidlo?.nazevUlice) {
        address += subject.sidlo.nazevUlice;
        if (subject.sidlo.cisloDomovni) {
          address += ` ${subject.sidlo.cisloDomovni}`;
        }
        if (subject.sidlo.cisloOrientacni) {
          address += `/${subject.sidlo.cisloOrientacni}`;
        }
      }

      return {
        ico: subject.ico,
        name: subject.obchodniJmeno,
        address: address || '',
        city: subject.sidlo?.nazevObce || '',
      };
    });
  } catch (error) {
    console.error('ARES search error:', error);
    return [];
  }
}
