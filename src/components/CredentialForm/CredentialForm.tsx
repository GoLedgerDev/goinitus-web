import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';
import { useConfigStore } from '@/store/configStore';
import { useGlobalStore } from '@/store/globalStore';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

interface CredentialFormProps {
  open: boolean;
  onClose: () => void;
}

export function CredentialForm({ open, onClose }: CredentialFormProps) {
  const setAuthToken = useConfigStore((s) => s.setAuthToken);
  const retry = useGlobalStore((s) => s.retry);
  const dismissCredentialForm = useGlobalStore((s) => s.dismissCredentialForm);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = async (data: FormValues) => {
    setAuthToken(data.username, data.password);
    dismissCredentialForm();
    onClose();
    await retry();
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="credential-form-title" maxWidth="xs" fullWidth>
      <DialogTitle id="credential-form-title">Authentication Required</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Username"
              autoComplete="username"
              autoFocus
              error={Boolean(errors.username)}
              helperText={errors.username?.message}
              inputProps={{ 'aria-label': 'Username' }}
              {...register('username')}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              inputProps={{ 'aria-label': 'Password' }}
              {...register('password')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} aria-label="Cancel credential entry">Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isSubmitting}
            aria-label="Submit credentials"
          >
            {isSubmitting ? 'Connecting…' : 'Connect'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
