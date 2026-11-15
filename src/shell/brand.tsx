/** Marca LeadRoll ("LR" com o menu recolhido). */
export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="font-semibold text-[17px] tracking-tight">
      {collapsed ? (
        <>
          L<span className="text-primary">R</span>
        </>
      ) : (
        <>
          Lead<span className="text-primary">Roll</span>
        </>
      )}
    </span>
  );
}
