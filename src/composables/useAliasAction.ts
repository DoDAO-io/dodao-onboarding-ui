import { useApolloQuery } from '@/composables/useApolloQuery';
import { useWeb3 } from '@/composables/useWeb3';
import client from '@/helpers/clientEIP712';
import { ALIASES_QUERY } from '@/helpers/queries';
import { lsGet, lsSet } from '@/helpers/utils';
import { getInstance } from '@/utils/auth/auth';
import { getDefaultProvider, Provider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { computed, ref } from 'vue';

const aliases = ref(lsGet('aliases') || {});
const isValidAlias = ref(false);

// The alias is a private key that is generated on your browser and used to sign messages
// without triggering Metamask, we use this for Join and Subscribe actions, the param "alias"
// that you see in the screenshot is the public key (address) of the private key

export function useAliasAction() {
  const { web3 } = useWeb3();
  const auth = getInstance();
  const { apolloQuery } = useApolloQuery();

  const userAlias = computed(() => {
    return aliases.value?.[web3.value.account];
  });

  const aliasWallet: any = computed(() => {
    const provider: Provider = getDefaultProvider();
    return userAlias.value ? new Wallet(userAlias.value, provider) : null;
  });

  async function checkAlias() {
    if (aliasWallet.value?.address && web3.value?.account) {
      const alias = await apolloQuery(
        {
          query: ALIASES_QUERY,
          variables: {
            address: web3.value.account,
            alias: aliasWallet.value.address
          }
        },
        'aliases'
      );

      isValidAlias.value =
        alias[0]?.address === web3.value.account &&
        alias[0]?.alias === aliasWallet.value.address;
    }
  }

  async function setAlias() {
    const rndWallet = Wallet.createRandom();
    aliases.value = Object.assign(
      {
        [web3.value.account]: rndWallet.privateKey
      },
      aliases.value
    );
    lsSet('aliases', aliases.value);

    if (aliasWallet.value?.address) {
      await client.alias(auth.web3, web3.value.account, {
        alias: aliasWallet.value.address
      });
    }
    await checkAlias();
  }

  return { setAlias, aliasWallet, isValidAlias, checkAlias };
}
