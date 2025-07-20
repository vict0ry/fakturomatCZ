# AI Refresh Problém - Opraveno

## Původní problém
- AI tvrdilo že přidalo položky/poznámky k faktuře
- Změny se neprojevovaly v UI 
- Frontend se nerefreshoval po AI akcích

## Příčina
React Query cache se neinvalidovala správně po AI operacích.

## Řešení implementováno

### 1. Agresivní cache invalidation
```javascript
// Agresivní refresh - invaliduj všechny invoice dotazy
queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
```

### 2. Specifický refresh pro editaci faktury
```javascript
if (invoiceMatch) {
  const invoiceId = parseInt(invoiceMatch[1]);
  queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
  queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId, "items"] });
}
```

### 3. Několik vln refreshe pro garantovanou aktualizaci
```javascript
setTimeout(() => {
  queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
  queryClient.refetchQueries({ queryKey: ["/api/invoices", invoiceId] });
}, 50);

setTimeout(() => {
  queryClient.refetchQueries({ queryKey: ["/api/invoices", invoiceId, "items"] });
}, 150);

setTimeout(() => {
  queryClient.refetchQueries();
}, 300);
```

## Prevence do budoucna

1. **Vždy používat akci `refresh_current_page`** po změnách v AI funkcích
2. **Testovat refresh** po každé AI akci
3. **Logovat refresh akce** pro debugging
4. **Používat více vln refreshe** pro složité operace

Toto řešení zajistí, že se UI vždy aktualizuje po AI akcích.