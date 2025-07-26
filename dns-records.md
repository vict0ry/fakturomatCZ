# DNS konfigurace pro doklad.ai email systém

## DKIM DNS Record

Pro správnou funkcionalnost DKIM podpisu přidejte tento TXT záznam do DNS:

**Název záznamu:** `default._domainkey.doklad.ai`
**Typ:** TXT
**Hodnota:** 
```
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj+MDsuqcQd5V63Og9vnm+KzN+vnr7MlajpriRTeW7fDvfVJsB3FI7KdbeHez7IM6l54EAfRTOHQTg7Aq0b3A020pLF2h8VNJJplEd/aBllAkANG70fU+3rUiy4J3n6CKMYsgCrLYWMHtByceut6tPSlFyWBE0X9gzfbR53ErSOcU1a18enKjACbkwTsQ1xOWtXWZ7cnhAOPwtxDx9Xna5fqopeeyjdOuCXVCmmu9fMJm/EetcvKPWUC0xqPdo0tq05c4rxewyxs7VX9hKVFFmEonU29nUajRYFkQerZ4lmhmkNfERy3tzE3TCmc9XF+af9lhPI/8Et5ErgJcoQacOwIDAQAB
```

## SPF Record (doporučené)

**Název záznamu:** `doklad.ai`
**Typ:** TXT
**Hodnota:** `v=spf1 include:_spf.google.com ~all`

## DMARC Record (doporučené)

**Název záznamu:** `_dmarc.doklad.ai`
**Typ:** TXT
**Hodnota:** `v=DMARC1; p=quarantine; rua=mailto:admin@doklad.ai`

## MX Record (pokud používáte vlastní doménu)

**Název záznamu:** `doklad.ai`
**Typ:** MX
**Priorita:** 10
**Hodnota:** `smtp.gmail.com`

---

## Ověření konfigurace

Po nastavení DNS záznamů můžete ověřit:

1. **DKIM:** `dig TXT default._domainkey.doklad.ai`
2. **SPF:** `dig TXT doklad.ai`
3. **DMARC:** `dig TXT _dmarc.doklad.ai`

Nebo použijte online nástroje jako:
- https://mxtoolbox.com/dkim.aspx
- https://dmarcian.com/dmarc-inspector/