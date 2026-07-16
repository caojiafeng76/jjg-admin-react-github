begin;

delete from public.sales_orders
where id in (
  'f82e5fec-b2d7-49e1-872d-9c9e78996dce',
  'db187adb-9d68-4afd-9088-fd8c51d1ad11',
  'f08357c0-f5f0-418c-bb35-fa7beb4ab6a1',
  'f9eb8232-5a1d-494d-abe2-c31aa5276ea6',
  'edc4d5b5-d55b-4e29-8bda-50e544fd88c7'
);

commit;
