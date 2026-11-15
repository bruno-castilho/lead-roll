-- Perfil "totem": a conta da tela da empresa que exibe o QR code de presença.
-- Depende de 20261113000000_profiles.sql (enum user_role).
-- Aplicar com `supabase db push` ou colando no SQL Editor do painel.
--
-- Fica sozinho neste arquivo: um valor novo de enum só pode ser usado depois
-- do commit da transação que o criou (a migration seguinte já o usa).

alter type public.user_role add value if not exists 'kiosk';
