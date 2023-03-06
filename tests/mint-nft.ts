import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MintNft } from "../target/types/mint_nft";
import { SolanaConfigService } from '@coin98/solana-support-library/config'
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import * as ssl from "@coin98/solana-support-library"
import {
  getMint, getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { Connection } from "@solana/web3.js";

describe("mint-nft", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MintNft as Program<MintNft>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  let root: anchor.web3.Keypair;
  let tokenAddress: anchor.web3.PublicKey;
  let mintKeypair: anchor.web3.Keypair;
  let metadataAddress: anchor.web3.PublicKey;
  let masterEditionAddress: anchor.web3.PublicKey;

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  before(async () => {
    root = await SolanaConfigService.getDefaultAccount();
    console.log(`Root: ${root.publicKey}`);

    mintKeypair = anchor.web3.Keypair.generate();
    tokenAddress = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: root.publicKey
    });
    console.log(`New token: ${mintKeypair.publicKey}`);
    console.log(`New token address: ${tokenAddress}`);
    const mintInfo = await getMint(connection, mintKeypair.publicKey);
    console.log(`Mint info:`, mintInfo);
  })

  it('Create Mint account', async () => {
    const tx = await program.methods.createMintAccount().accounts({
      mint: mintKeypair.publicKey,
      mintAuthority: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([mintKeypair, root]).rpc();
    console.log(`Create mint account tx:`, tx);
    await new Promise(f => setTimeout(f, 100));
    
    const mintInfo = await getMint(connection, mintKeypair.publicKey);
    console.log(`Mint info:`, mintInfo);
  });

  it('Initialize Mint account', async () => {
    const tx = await program.methods.initializeMint().accounts({
      mint: mintKeypair.publicKey,
      mintAuthority: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([mintKeypair, root]).rpc();
    await new Promise(f => setTimeout(f, 100));
    console.log(`Initialize mint account tx:`, tx);

    const mintInfo = await getMint(connection, mintKeypair.publicKey);
    console.log(`Mint info:`, mintInfo);
  });

  it('Create ATA', async () => {
    const tx = await program.methods.createAssociatedTokenAccount().accounts({
      payer: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ssl.ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
      mint: mintKeypair.publicKey,
      authority: root.publicKey,
      associatedToken: tokenAddress,
    }).signers([root, mintKeypair]).rpc();
    console.log(`Create ATA tx:`, tx);
    await new Promise(f => setTimeout(f, 100));

    const senderATA = await getOrCreateAssociatedTokenAccount(
      connection,
      root,
      mintKeypair.publicKey,
      root.publicKey
    );
    console.log('Sender ATA', senderATA.address.toBase58());
  });

  it('Mint token to ATA', async () => {
    const tx = await program.methods.mintToken(new anchor.BN(1)).accounts({
      mint: mintKeypair.publicKey,
      authority: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: tokenAddress,
      payer: root.publicKey,
    }).signers([mintKeypair, root]).rpc();
    console.log(`Mint token to ATA tx:`, tx);
    await new Promise(f => setTimeout(f, 100));

    const mintInfo = await getMint(connection, mintKeypair.publicKey);
    console.log(`Mint info:`, mintInfo);

    const senderATA = await getOrCreateAssociatedTokenAccount(
      connection,
      root,
      mintKeypair.publicKey,
      root.publicKey
    );
    console.log('Sender ATA', senderATA.amount);
  });

  it('Create metadata account', async () => {
    metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
    console.log(`Metadata address:`, metadataAddress.toBase58());



    const tx = await program.methods.createTokenMetadataAccount([
      {
        address: root.publicKey,
        verified: true,
        share: 100,
      }
    ], 
    "Hello I'm back",
    "HIB", 
    "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json"
    ).accounts({
      metadataAccount: metadataAddress,
      mint: mintKeypair.publicKey,
      mintAuthority: root.publicKey,
      payer: root.publicKey,
      updateAuthority: root.publicKey,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .signers([root]).rpc()
    .catch(e => console.log(e));
  console.log(`Create metadata account tx:`, tx);
  });

  it('Create master edition account', async () => {
    masterEditionAddress = await anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
    console.log(`Master edition address:`, masterEditionAddress.toBase58());
    const tx = await program.methods.createMasterEditionAccount(new anchor.BN(3)).accounts({
      masterEditionAccount: masterEditionAddress,
      mint: mintKeypair.publicKey,
      mintAuthority: root.publicKey,
      payer: root.publicKey,
      updateAuthority: root.publicKey,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      metadataAccount: metadataAddress,
    }).signers([root]).rpc().catch(e => console.log(e));
    console.log(`Create metadata account tx:`, tx);
  })

});
