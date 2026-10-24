# Pré-reservas de shows — Lippi & Léo

## Preservação obrigatória
Não alterar o HTML/CSS atual, as fotos, o fundo, a disposição do calendário, os shows publicados ou os bloqueios existentes. A interface adicional deve ser um modal acionado somente ao clicar em data disponível.

## Fluxo
1. Contratante clica em data livre (não passada, sem show confirmado e sem bloqueio).
2. Modal solicita nome do contratante, local do evento, cidade/UF, horário desejado e WhatsApp.
3. Envio cria solicitação **pendente**, nunca um show confirmado.
4. Administrador autenticado consulta pedidos, aprova ou recusa. Apenas aprovação altera disponibilidade pública e deve sincronizar com o fluxo atual de agenda/shows.json, sem sobrescrever registros existentes.
5. Contratante recebe confirmação de recebimento, não confirmação de contratação.

## Infraestrutura necessária
A hospedagem GitHub Pages é estática: não aceita gravação autenticada de solicitações. Implementar backend com banco e autenticação (por exemplo Supabase, com políticas RLS e função server-side). Não expor chaves administrativas no navegador. A verificação de disponibilidade e a aprovação devem ser transações atômicas no servidor para evitar conflitos. Ler também agenda/bloqueios.json no site oficial e rejeitar datas bloqueadas. Validar campos, limitar abuso, aplicar política de retenção/LGPD e restringir visualização dos contatos à equipe autorizada.

## WhatsApp
Notificação automática requer provedor/API e credenciais próprias. Não incluir tokens no GitHub. Até configurar a integração, não anunciar notificações como ativas.

## Checklist de publicação
- Confirmar qual serviço de backend e conta serão utilizados.
- Configurar banco, autenticação, políticas e endpoint.
- Integrar modal isolado na página da agenda.
- Adicionar fila de solicitações no painel administrativo com autenticação.
- Testar datas ocupadas, bloqueios, dupla solicitação, aprovação e recusa.
- Revisar visual em celular e desktop antes de publicar.
